import pool from '../config/database';

export interface Session {
  id: string;
  mentor_id: string;
  learner_id: string;
  start_time: Date;
  end_time: Date;
  status: 'scheduled' | 'completed' | 'cancelled';
  created_at: Date;
}

export const SessionModel = {
  async initializeTable(): Promise<void> {
    const query = `
      CREATE TABLE IF NOT EXISTS sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        mentor_id UUID NOT NULL,
        learner_id UUID NOT NULL,
        start_time TIMESTAMP WITH TIME ZONE NOT NULL,
        end_time TIMESTAMP WITH TIME ZONE NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'scheduled',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await pool.query(query);
  },

  async findByUserId(userId: string): Promise<Session[]> {
    const query = `
      SELECT * FROM sessions
      WHERE mentor_id = $1 OR learner_id = $1
      ORDER BY start_time DESC;
    `;
    const { rows } = await pool.query<Session>(query, [userId]);
    return rows;
  },
};
