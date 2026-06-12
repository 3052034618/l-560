import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class Device {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  code: string;

  @Column()
  name: string;

  @Column()
  type: string;

  @Column({ default: 'idle' })
  status: string;

  @Column({ type: 'real' })
  designCapacity: number;

  @Column({ type: 'real' })
  temperatureMin: number;

  @Column({ type: 'real' })
  temperatureMax: number;

  @Column({ type: 'real' })
  pressureMin: number;

  @Column({ type: 'real' })
  pressureMax: number;

  @Column({ nullable: true, type: 'text' })
  description: string;

  @CreateDateColumn()
  createdAt: string;

  @UpdateDateColumn()
  updatedAt: string;
}
