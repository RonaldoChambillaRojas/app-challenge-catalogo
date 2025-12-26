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
import { Producto } from './producto.entity';
import { FamiliaProducto } from './familia-producto.entity';
@Entity('subfamiliaproducto')
export class SubFamiliaProducto {
  @PrimaryGeneratedColumn({ name: 'IdSubFamiliaProducto' })
  idSubFamiliaProducto: number;

  @Column({ name: 'NombreSubFamiliaProducto', type: 'varchar', length: 250 })
  nombreSubFamiliaProducto: string;

  @Column({ name: 'IdFamiliaProducto', type: 'int' })
  idFamiliaProducto: number;

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
  @ManyToOne(() => FamiliaProducto, (familia) => familia.subFamilias)
  @JoinColumn({ name: 'IdFamiliaProducto' })
  familiaProducto: FamiliaProducto;

  @OneToMany(() => Producto, (producto) => producto.subFamiliaProducto)
  productos: Producto[];
}