import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Marca } from './marca.entity';
import { Producto } from './producto.entity';

@Entity('modelo')
export class Modelo {
  @PrimaryGeneratedColumn({ name: 'IdModelo' })
  idModelo: number;

  @Column({ name: 'IdMarca', type: 'int' })
  idMarca: number;

  @Column({ name: 'NombreModelo', type: 'varchar', length: 250 })
  nombreModelo: string;

  @Column({ name: 'NoEspecificado', type: 'varchar', length: 1 })
  noEspecificado: string;

  @Column({ name: 'IndicadorEstado', type: 'varchar', length: 1 })
  indicadorEstado: string;

  @Column({ name: 'UsuarioRegistro', type: 'varchar', length: 50 })
  usuarioRegistro: string;

  @CreateDateColumn({ name: 'FechaRegistro', type: 'timestamp' })
  fechaRegistro: Date;

  @Column({
    name: 'UsuarioModificacion',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  usuarioModificacion: string;

  @UpdateDateColumn({
    name: 'FechaModificacion',
    type: 'timestamp',
    nullable: true,
  })
  fechaModificacion: Date;

  @Column({
    name: 'EstadoSincronizacion',
    type: 'char',
    length: 1,
    default: '0',
  })
  estadoSincronizacion: string;

  // Relaciones
  @ManyToOne(() => Marca, (marca) => marca.modelos)
  @JoinColumn({ name: 'IdMarca' })
  marca: Marca;

  @OneToMany(() => Producto, (producto) => producto.modelo)
  productos: Producto[];
}