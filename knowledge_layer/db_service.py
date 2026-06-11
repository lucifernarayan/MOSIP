"""
db_service.py
-------------
Direct SQLAlchemy data access for the MOSIP knowledge layer.
No HTTP round-trips — reads straight from the PostgreSQL engine.
"""

from sqlalchemy import text
from backend.database.db import engine


def get_satellite_profile(norad_id: int) -> dict | None:
    """
    Full satellite profile: base TLE data + latest orbital parameters
    + latest risk assessment in one query.
    """
    sql = text("""
        SELECT
            s.id,
            s.norad_id,
            s.object_name,
            s.object_id,
            s.epoch_time,
            s.inclination,
            s.eccentricity,
            s.mean_motion,
            s.bstar,
            s.raan,
            s.arg_of_perigee,
            op.altitude_km,
            op.apogee_km,
            op.perigee_km,
            op.orbit_type,
            op.period_minutes,
            op.semi_major_axis,
            r.risk_score,
            r.risk_level,
            r.collision_risk,
            r.debris_risk,
            r.altitude_risk,
            r.risk_drivers
        FROM   satellites s
        LEFT   JOIN LATERAL (
            SELECT altitude_km, apogee_km, perigee_km, orbit_type,
                   period_minutes, semi_major_axis
            FROM   orbital_parameters
            WHERE  satellite_id = s.id
            ORDER  BY created_at DESC
            LIMIT  1
        ) op ON true
        LEFT   JOIN LATERAL (
            SELECT risk_score, risk_level, collision_risk,
                   debris_risk, altitude_risk, risk_drivers
            FROM   risk_assessments
            WHERE  satellite_id = s.id
            ORDER  BY assessed_at DESC
            LIMIT  1
        ) r ON true
        WHERE  s.norad_id = :norad_id
    """)
    with engine.connect() as conn:
        row = conn.execute(sql, {"norad_id": norad_id}).fetchone()
    if not row:
        return None
    return dict(row._mapping)


def get_population_metrics() -> dict:
    """Aggregate metrics across the full tracked population."""
    with engine.connect() as conn:
        total = conn.execute(
            text("SELECT COUNT(*) FROM satellites")
        ).scalar() or 0

        orbit_dist = dict(conn.execute(text("""
            SELECT orbit_type, COUNT(*) FROM orbital_parameters
            WHERE orbit_type IS NOT NULL
            GROUP BY orbit_type
        """)).fetchall())

        risk_dist = dict(conn.execute(text("""
            SELECT risk_level, COUNT(*) FROM risk_assessments
            GROUP BY risk_level
        """)).fetchall())

        avg_risk = conn.execute(
            text("SELECT AVG(risk_score) FROM risk_assessments")
        ).scalar()

    return {
        "total_satellites":   total,
        "orbit_distribution": orbit_dist,
        "risk_distribution":  risk_dist,
        "average_risk_score": round(float(avg_risk), 2) if avg_risk else 0.0,
    }


def get_orbit_neighbors(orbit_type: str, altitude_km: float,
                         radius_km: float = 100, limit: int = 10) -> list[dict]:
    """
    Return satellites in the same orbital shell (within ±radius_km altitude).
    Used by the Sustainability and Collision agents for congestion analysis.
    """
    sql = text("""
        SELECT s.norad_id, s.object_name, op.altitude_km,
               op.orbit_type, r.risk_score
        FROM   satellites s
        JOIN   orbital_parameters op ON op.satellite_id = s.id
        LEFT   JOIN risk_assessments r ON r.satellite_id = s.id
        WHERE  op.orbit_type = :orbit_type
          AND  op.altitude_km BETWEEN :lo AND :hi
        ORDER  BY r.risk_score DESC NULLS LAST
        LIMIT  :limit
    """)
    lo = (altitude_km or 0) - radius_km
    hi = (altitude_km or 0) + radius_km
    with engine.connect() as conn:
        rows = conn.execute(sql, {
            "orbit_type": orbit_type,
            "lo": lo, "hi": hi, "limit": limit
        }).fetchall()
    return [dict(r._mapping) for r in rows]


def get_high_risk_neighbors(orbit_type: str, threshold: float = 60.0,
                             limit: int = 5) -> list[dict]:
    """Satellites in the same orbit regime with risk above threshold."""
    sql = text("""
        SELECT s.norad_id, s.object_name, r.risk_score, r.risk_level
        FROM   risk_assessments r
        JOIN   satellites s ON s.id = r.satellite_id
        WHERE  r.orbit_type = :orbit_type
          AND  r.risk_score >= :threshold
        ORDER  BY r.risk_score DESC
        LIMIT  :limit
    """)
    with engine.connect() as conn:
        rows = conn.execute(sql, {
            "orbit_type": orbit_type,
            "threshold": threshold,
            "limit": limit,
        }).fetchall()
    return [dict(r._mapping) for r in rows]


if __name__ == "__main__":
    profile = get_satellite_profile(25544)
    print("ISS Profile:", profile)
    print("Population:", get_population_metrics())