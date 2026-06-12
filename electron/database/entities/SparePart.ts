import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class SparePart {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  code: string;

  @Column()
  name: string;

  @Column()
  type: string;

  @Column({ type: 'real' })
  stock: number;

  @Column()
  unit: string;

  @Column({ type: 'real' })
  safetyStock: number;

  @Column()
  location: string;

  @Column({ type: 'real' })
  price: number;

  @CreateDateColumn()
  createdAt: string;

  @UpdateDateColumn()
  updatedAt: string;
}
