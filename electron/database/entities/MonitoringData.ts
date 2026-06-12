import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity()
export class MonitoringData {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  deviceCode: string;

  @Column()
  parameter: string;

  @Column({ type: 'real' })
  value: number;

  @Column()
  unit: string;

  @Column({ default: 'normal' })
  status: string;

  @CreateDateColumn()
  timestamp: string;
}
