import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { SubFamiliaProducto } from './sub-familia-producto.entity';
import { Modelo } from './modelo.entity';
import { LineaProducto } from './linea-producto.entity';

@Entity('producto')
export class Producto {
  @PrimaryGeneratedColumn({ name: 'IdProducto' })
  idProducto: number;

  @Column({ name: 'NombreProducto', type: 'varchar', length: 300, default: '' })
  nombreProducto: string;

  @Column({
    name: 'NombreLargoProducto',
    type: 'varchar',
    length: 1000,
    default: '',
  })
  nombreLargoProducto: string;

  @Column({ name: 'EstadoProducto', type: 'char', length: 1, default: '1' })
  estadoProducto: string;

  // Códigos
  @Column({ name: 'CodigoMercaderia', type: 'varchar', length: 30, default: '' })
  codigoMercaderia: string;

  @Column({
    name: 'CodigoMercaderia2',
    type: 'varchar',
    length: 60,
    default: '',
  })
  codigoMercaderia2: string;

  @Column({ name: 'CodigoAlterno', type: 'varchar', length: 350, default: '' })
  codigoAlterno: string;

  @Column({
    name: 'CodigoBarras',
    type: 'varchar',
    length: 250,
    nullable: true,
  })
  codigoBarras: string;

  // Relaciones (IDs)
  @Column({ name: 'IdSubFamiliaProducto', type: 'int' })
  idSubFamiliaProducto: number;


  // IDs que no tienen tablas relacionadas (solo se guardan como enteros)
  @Column({ name: 'IdProveedor', type: 'int', default: 0 })
  idProveedor: number;

  @Column({ name: 'IdTipoExistencia', type: 'int', default: 1 })
  idTipoExistencia: number;

  @Column({ name: 'IdUnidadMedida', type: 'int', default: 1 })
  idUnidadMedida: number;

  @Column({ name: 'IdTipoSistemaISC', type: 'int', nullable: true })
  idTipoSistemaISC: number;

  @Column({ name: 'IdTipoAfectacionIGV', type: 'int', default: 1 })
  idTipoAfectacionIGV: number;

  @Column({ name: 'IdTipoPrecio', type: 'int', nullable: true })
  idTipoPrecio: number;

  @Column({ name: 'IdFabricante', type: 'int', nullable: true })
  idFabricante: number;

  @Column({ name: 'IdMoneda', type: 'int', nullable: true })
  idMoneda: number;

  @Column({ name: 'IdTipoTributo', type: 'int', default: 1 })
  idTipoTributo: number;

  @Column({ name: 'IdOrigenMercaderia', type: 'int', default: 1 })
  idOrigenMercaderia: number;

  @Column({ name: 'IdMonedaCompra', type: 'int', default: 1 })
  idMonedaCompra: number;

  @Column({ name: 'IdMonedaUltimoPrecio', type: 'int', nullable: true })
  idMonedaUltimoPrecio: number;

  @Column({ name: 'IdUnidadMedidaReferencia', type: 'int', nullable: true })
  idUnidadMedidaReferencia: number;

  // Datos Logísticos y Precios
  @Column({ name: 'StockMinimo', type: 'decimal', precision: 10, scale: 2, nullable: true })
  stockMinimo: number;

  @Column({ name: 'StockMaximo', type: 'decimal', precision: 10, scale: 2, nullable: true })
  stockMaximo: number;

  @Column({
    name: 'SaldoFisico',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0.0,
  })
  saldoFisico: number;

  @Column({ name: 'PesoUnitario', type: 'decimal', precision: 10, scale: 2, nullable: true })
  pesoUnitario: number;

  @Column({ name: 'PrecioUnitario', type: 'decimal', precision: 10, scale: 2, nullable: true })
  precioUnitario: number;

  @Column({ name: 'UltimoPrecio', type: 'decimal', precision: 15, scale: 6, nullable: true })
  ultimoPrecio: number;

  @Column({ name: 'FechaUltimoPrecio', type: 'timestamp', nullable: true })
  fechaUltimoPrecio: Date;

  @Column({
    name: 'CostoUnitarioCompra',
    type: 'decimal',
    precision: 15,
    scale: 6,
    default: 0.0,
  })
  costoUnitarioCompra: number;

  @Column({
    name: 'PrecioUnitarioCompra',
    type: 'decimal',
    precision: 15,
    scale: 6,
    default: 0.0,
  })
  precioUnitarioCompra: number;

  @Column({ name: 'ValorVenta', type: 'decimal', precision: 15, scale: 4, nullable: true })
  valorVenta: number;

  // Datos Informativos
  @Column({ name: 'Referencia', type: 'varchar', length: 2500, default: '' })
  referencia: string;

  @Column({ name: 'Foto', type: 'varchar', length: 250, nullable: true })
  foto: string | null;

  @Column({ name: 'Ano', type: 'int', nullable: true })
  ano: number;

  @Column({ name: 'Color', type: 'varchar', length: 50, nullable: true })
  color: string;

  @Column({ name: 'Talla', type: 'varchar', length: 50, nullable: true })
  talla: string;

  @Column({ name: 'Genero', type: 'varchar', length: 1, default: '0' })
  genero: string;

  // Auditoría
  @Column({ name: 'IndicadorEstado', type: 'varchar', length: 1, default: 'A' })
  indicadorEstado: string;

  @Column({ name: 'UsuarioRegistro', type: 'varchar', length: 50, default: 'ADMIN' })
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

  // Relaciones con otras entidades
  @ManyToOne(() => SubFamiliaProducto, (subFamilia) => subFamilia.productos)
  @JoinColumn({ name: 'IdSubFamiliaProducto' })
  subFamiliaProducto: SubFamiliaProducto;

  @ManyToOne(() => Modelo, (modelo) => modelo.productos,{
    nullable: true,
  })
  @JoinColumn({ name: 'IdModelo' })
  modelo: Modelo | null;

  @ManyToOne(() => LineaProducto, (linea) => linea.productos,{
    nullable: true,
  })
  @JoinColumn({ name: 'IdLineaProducto' })
  lineaProducto: LineaProducto;
}