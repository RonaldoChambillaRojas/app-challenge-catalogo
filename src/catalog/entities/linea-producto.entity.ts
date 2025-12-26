import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Producto } from './producto.entity';

@Entity('lineaproducto')
export class LineaProducto {
  @PrimaryGeneratedColumn({ name: 'IdLineaProducto' })
  idLineaProducto: number;

  @Column({ name: 'NombreLineaProducto', type: 'varchar', length: 250 })
  nombreLineaProducto: string;

  @Column({ name: 'IndicadorEstado', type: 'varchar', length: 1 })
  indicadorEstado: string;

  @Column({ name: 'NoEspecificado', type: 'varchar', length: 1 })
  noEspecificado: string;

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
  @OneToMany(() => Producto, (producto) => producto.lineaProducto)
  productos: Producto[];
}