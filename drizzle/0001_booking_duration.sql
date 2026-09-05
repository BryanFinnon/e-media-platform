ALTER TABLE bookings
ADD COLUMN duration_minutes INTEGER NOT NULL DEFAULT 60
CHECK (
  duration_minutes >= 30
  AND duration_minutes <= 720
  AND duration_minutes % 30 = 0
);

PRAGMA optimize;
