import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class Shift {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  shiftDate: string;

  @Column()
  shiftType: string;

  @Column()
  employeeCode: string;

  @Column()
  deviceCode: string;

  @Column()
  startTime: string;

  @Column()
  endTime: string;

  @Column({ type: 'text', nullable: true })
  tasks: string;

  @CreateDateColumn()
  createdAt: string;

  @UpdateDateColumn()
  updatedAt: string;
}
