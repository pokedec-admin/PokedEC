-- Make trainer_name unique and required
ALTER TABLE trainers
  ALTER COLUMN trainer_name SET NOT NULL,
  ADD CONSTRAINT unique_trainer_name UNIQUE (trainer_name);
