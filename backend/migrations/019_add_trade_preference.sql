-- Migration: Add trade_preference column to trainers table
ALTER TABLE trainers ADD COLUMN IF NOT EXISTS trade_preference VARCHAR(50);
