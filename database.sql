-- KidGuard / CLMS — MySQL schema (aligns with clms-backend ensureSchema + upsert logic)
-- Optional: periodic snapshot child_latest_location → location_history is done in Node
-- (LOCATION_SNAPSHOT_INTERVAL_MS; default 1 min in code for test, use 3600000 for 60 min prod), not MySQL EVENT.

CREATE DATABASE IF NOT EXISTS clms
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE clms;

-- clms.child_latest_location definition

CREATE TABLE `child_latest_location` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `child_id` varchar(128) NOT NULL,
  `lat` double NOT NULL,
  `lng` double NOT NULL,
  `captured_at` bigint NOT NULL,
  `geofence_violated` tinyint(1) NOT NULL DEFAULT '0',
  `distance_from_center_meters` double DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `child_id` (`child_id`)
) ENGINE=InnoDB AUTO_INCREMENT=133 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- clms.children definition

CREATE TABLE `children` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `child_id` varchar(128) NOT NULL,
  `display_name` varchar(128) NOT NULL,
  `thing_id` varchar(128) DEFAULT NULL,
  `active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `child_id` (`child_id`)
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- clms.geofence definition

CREATE TABLE `geofence` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `child_id` varchar(128) NOT NULL,
  `center_lat` double NOT NULL,
  `center_lng` double NOT NULL,
  `radius_meters` double NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `child_id` (`child_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- clms.location_history definition

CREATE TABLE `location_history` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `child_id` varchar(128) NOT NULL,
  `lat` double NOT NULL,
  `lng` double NOT NULL,
  `captured_at` bigint NOT NULL,
  `geofence_violated` tinyint(1) NOT NULL DEFAULT '0',
  `distance_from_center_meters` double DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_location_history_child_time` (`child_id`,`captured_at` DESC)
) ENGINE=InnoDB AUTO_INCREMENT=152 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- clms.safe_zones definition

CREATE TABLE `safe_zones` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `child_id` varchar(128) DEFAULT NULL,
  `zone_name` varchar(128) NOT NULL,
  `center_lat` double NOT NULL,
  `center_lng` double NOT NULL,
  `radius_meters` double NOT NULL,
  `active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `shape_type` varchar(16) NOT NULL DEFAULT 'circle',
  `corner_a_lat` double DEFAULT NULL,
  `corner_a_lng` double DEFAULT NULL,
  `corner_c_lat` double DEFAULT NULL,
  `corner_c_lng` double DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- clms.safe_zone_children definition (many-to-many between zones and children)

CREATE TABLE `safe_zone_children` (
  `zone_id` bigint NOT NULL,
  `child_id` varchar(128) NOT NULL,
  PRIMARY KEY (`zone_id`,`child_id`),
  KEY `idx_szc_child` (`child_id`),
  CONSTRAINT `fk_szc_zone` FOREIGN KEY (`zone_id`) REFERENCES `safe_zones` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_szc_child` FOREIGN KEY (`child_id`) REFERENCES `children` (`child_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- clms.child_zone_state definition (current inside/outside status per (child, zone))

CREATE TABLE `child_zone_state` (
  `child_id` varchar(128) NOT NULL,
  `zone_id` bigint NOT NULL,
  `inside` tinyint(1) NOT NULL,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`child_id`,`zone_id`),
  KEY `idx_czs_zone` (`zone_id`),
  CONSTRAINT `fk_czs_child` FOREIGN KEY (`child_id`) REFERENCES `children` (`child_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_czs_zone` FOREIGN KEY (`zone_id`) REFERENCES `safe_zones` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- clms.zone_events definition (append-only log of zone enter/leave transitions)

CREATE TABLE `zone_events` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `child_id` varchar(128) NOT NULL,
  `zone_id` bigint NOT NULL,
  `kind` enum('enter','leave') NOT NULL,
  `occurred_at` bigint NOT NULL,
  `lat` double DEFAULT NULL,
  `lng` double DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_ze_child_time` (`child_id`,`occurred_at` DESC),
  KEY `idx_ze_zone` (`zone_id`),
  CONSTRAINT `fk_ze_child` FOREIGN KEY (`child_id`) REFERENCES `children` (`child_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ze_zone` FOREIGN KEY (`zone_id`) REFERENCES `safe_zones` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;





-- Seed data



USE clms;

INSERT INTO geofence (child_id, center_lat, center_lng, radius_meters)
VALUES ('cb184099-9a5c-4a47-a5cc-d712bff00f7a', 10.928, 106.702, 800)
ON DUPLICATE KEY UPDATE
  center_lat = VALUES(center_lat),
  center_lng = VALUES(center_lng),
  radius_meters = VALUES(radius_meters);

INSERT INTO child_latest_location (
  child_id, lat, lng, captured_at, geofence_violated, distance_from_center_meters
) VALUES (
  'cb184099-9a5c-4a47-a5cc-d712bff00f7a',
  10.928,
  106.702,
  UNIX_TIMESTAMP() * 1000,
  0,
  NULL
)
ON DUPLICATE KEY UPDATE
  lat = VALUES(lat),
  lng = VALUES(lng),
  captured_at = VALUES(captured_at),
  geofence_violated = VALUES(geofence_violated),
  distance_from_center_meters = VALUES(distance_from_center_meters);

INSERT INTO location_history (
  child_id, lat, lng, captured_at, geofence_violated, distance_from_center_meters
) VALUES (
  'cb184099-9a5c-4a47-a5cc-d712bff00f7a',
  10.928,
  106.702,
  UNIX_TIMESTAMP() * 1000,
  0,
  NULL
);
