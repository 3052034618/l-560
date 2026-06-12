import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class ProductionSchedule {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  scheduleDate: string;

  @Column()
  shift: string;

  @Column()
  deviceCode: string;

  @Column({ type: 'text' })
  product: string;

  @Column({ type: 'real' })
  plannedOutput: number;

  @Column({ type: 'real', default: 0 })
  actualOutput: number;

  @Column()
  startTime: string;

  @Column()
  endTime: string;

  @Column({ type: 'text', nullable: true })
  rawMaterials: string;

  @Column({ default: 'draft' })
  status: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: string;

  @UpdateDateColumn()
  updatedAt: string;
}
