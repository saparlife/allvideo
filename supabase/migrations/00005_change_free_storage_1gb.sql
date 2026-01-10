-- Change default free storage from 10GB to 1GB
ALTER TABLE users ALTER COLUMN storage_limit_bytes SET DEFAULT 1073741824; -- 1GB free

-- Also update subscriptions table default
ALTER TABLE subscriptions ALTER COLUMN storage_limit_gb SET DEFAULT 1;

-- Comment explaining the change
COMMENT ON COLUMN users.storage_limit_bytes IS 'Storage limit in bytes. Default: 1GB (1073741824 bytes) for free tier';
