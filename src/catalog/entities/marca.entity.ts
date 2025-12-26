import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Modelo } from './modelo.entity';
@Entity('marca')
export class Marca {
  @PrimaryGeneratedColumn({ name: 'IdMarca' })
  idMarca: number;

  @Column({ name: 'NombreMarca', type: 'varchar', length: 250 })
  nombreMarca: string;

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
    name: 'InicialesMarcaNombreProducto',
    type: 'char',
    length: 20,
    default: '',
  })
  inicialesMarcaNombreProducto: string;

  @Column({
    name: 'InicialesMarcaCodigoProducto',
    type: 'char',
    length: 20,
    default: '',
  })
  inicialesMarcaCodigoProducto: string;

  @Column({
    name: 'EstadoSincronizacion',
    type: 'char',
    length: 1,
    default: '0',
  })
  estadoSincronizacion: string;

  // Relaciones
  @OneToMany(() => Modelo, (modelo) => modelo.marca)
  modelos: Modelo[];
}