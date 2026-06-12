import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity()
export class DeviceStatus {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  deviceCode: string;

  @Column({ type: 'real' })
  temperature: number;

  @Column({ type: 'real' })
  pressure: number;

  @Column({ type: 'real', default: 0 })
  level: number;

  @Column({ type: 'real', default: 0 })
  flowRate: number;

  @Column({ type: 'real', default: 0 })
  currentOutput: number;

  @Column({ type: 'int', default: 0 })
  runHours: number;

  @Column({ default: 'normal' })
  healthStatus: string;

  @CreateDateColumn()
  timestamp: string;
}
