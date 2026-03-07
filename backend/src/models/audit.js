const createAuditLogsTable = async (pool) => {
  const query = `
    CREATE TABLE IF NOT EXISTS audit_logs (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES trainers(id) ON DELETE SET NULL,
      action VARCHAR(50) NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
      table_name VARCHAR(50) NOT NULL,
      record_id INTEGER,
      old_data JSONB,
      new_data JSONB,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- Index for faster filtering
    CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_table_record ON audit_logs(table_name, record_id);
  `;
  return pool.query(query);
};

const createAuditTriggerFunction = async (pool) => {
  const query = `
    CREATE OR REPLACE FUNCTION process_audit_log() RETURNS TRIGGER AS $$
    BEGIN
        IF (TG_OP = 'DELETE') THEN
            INSERT INTO audit_logs (user_id, action, table_name, record_id, old_data)
            VALUES (
                (SELECT id FROM trainers WHERE id = OLD.user_id), 
                'DELETE', 
                TG_TABLE_NAME, 
                OLD.id, 
                to_jsonb(OLD)
            );
            RETURN OLD;
        ELSIF (TG_OP = 'UPDATE') THEN
            INSERT INTO audit_logs (user_id, action, table_name, record_id, old_data, new_data)
            VALUES (
                (SELECT id FROM trainers WHERE id = NEW.user_id), 
                'UPDATE', 
                TG_TABLE_NAME, 
                NEW.id, 
                to_jsonb(OLD), 
                to_jsonb(NEW)
            );
            RETURN NEW;
        ELSIF (TG_OP = 'INSERT') THEN
            INSERT INTO audit_logs (user_id, action, table_name, record_id, new_data)
            VALUES (
                (SELECT id FROM trainers WHERE id = NEW.user_id), 
                'INSERT', 
                TG_TABLE_NAME, 
                NEW.id, 
                to_jsonb(NEW)
            );
            RETURN NEW;
        END IF;
        RETURN NULL;
    END;
    $$ LANGUAGE plpgsql;
  `;
  return pool.query(query);
};

const applyAuditTriggerToPokedex = async (pool) => {
  const query = `
    DO $$
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_audit_pokedex') THEN
            CREATE TRIGGER trg_audit_pokedex
            AFTER INSERT OR UPDATE OR DELETE ON pokedex
            FOR EACH ROW EXECUTE FUNCTION process_audit_log();
        END IF;
    END $$;
  `;
  return pool.query(query);
};

module.exports = { 
  createAuditLogsTable, 
  createAuditTriggerFunction,
  applyAuditTriggerToPokedex
};
