import { HashRouter, Route, Routes } from 'react-router-dom';
import { DataProvider } from './lib/DataContext';
import { AuthProvider } from './lib/AuthContext';
import { ThemeProvider } from './lib/ThemeContext';
import { AppLayout } from './components/layout/AppLayout';
import { SuperAdminLayout } from './components/layout/SuperAdminLayout';
import { RequireAuth } from './components/auth/RequireAuth';
import { RequirePermission } from './components/auth/RequirePermission';
import { LoginPage } from './pages/LoginPage';
import { RestablecerPasswordPage } from './pages/RestablecerPasswordPage';
import { Dashboard } from './pages/Dashboard';
import { EmpresasSection } from './pages/superadmin/EmpresasSection';
import { CatalogosHubPage } from './pages/catalogos/CatalogosHubPage';
import { ClientesPage } from './pages/catalogos/ClientesPage';
import { DestinatariosPage } from './pages/catalogos/DestinatariosPage';
import { ProveedoresPage } from './pages/catalogos/ProveedoresPage';
import { ConstanciaFiscalPage } from './pages/catalogos/ConstanciaFiscalPage';
import { CuentasBancariasPage } from './pages/catalogos/CuentasBancariasPage';
import { EstatusViajePage } from './pages/catalogos/EstatusViajePage';
import { EstatusUnidadPage } from './pages/catalogos/EstatusUnidadPage';
import { ClasificacionesViajePage } from './pages/catalogos/ClasificacionesViajePage';
import { GruposUnidadPage } from './pages/catalogos/GruposUnidadPage';
import { TiposViajePage } from './pages/catalogos/TiposViajePage';
import { ClasificacionesOperadorPage } from './pages/catalogos/ClasificacionesOperadorPage';
import { ConceptosFacturacionPage } from './pages/catalogos/ConceptosFacturacionPage';
import { RutasPage } from './pages/catalogos/RutasPage';
import { UnidadesPage } from './pages/catalogos/UnidadesPage';
import { RemolquesPage } from './pages/catalogos/RemolquesPage';
import { OperadoresPage } from './pages/catalogos/OperadoresPage';
import { ViajesPage } from './pages/ViajesPage';
import { GastosViajePage } from './pages/GastosViajePage';
import { ImprimirViajePage } from './pages/ImprimirViajePage';
import { ImprimirGastoViajePage } from './pages/ImprimirGastoViajePage';
import { ParqueVehicularPage } from './pages/ParqueVehicularPage';
import { ImprimirParqueVehicularPage } from './pages/ImprimirParqueVehicularPage';
import { FacturacionPage } from './pages/FacturacionPage';
import { FacturacionPorViajePage } from './pages/facturacion/FacturacionPorViajePage';
import { FacturacionPorConceptoPage } from './pages/facturacion/FacturacionPorConceptoPage';
import { ImprimirFacturaPage } from './pages/facturacion/ImprimirFacturaPage';
import { CobranzaComplementosPagoPage } from './pages/cobranza/CobranzaComplementosPagoPage';
import { ImprimirPagoClientePage } from './pages/cobranza/ImprimirPagoClientePage';
import { CobranzaNotasCreditoPage } from './pages/cobranza/CobranzaNotasCreditoPage';
import { ImprimirNotaCreditoPage } from './pages/cobranza/ImprimirNotaCreditoPage';
import { CobranzaEstadosCuentaPage } from './pages/cobranza/CobranzaEstadosCuentaPage';
import { ImprimirEstadoCuentaPage } from './pages/cobranza/ImprimirEstadoCuentaPage';
import { MovimientosBancariosPage } from './pages/banco/MovimientosBancariosPage';
import { CuentasPorPagarPage } from './pages/banco/CuentasPorPagarPage';
import { ImprimirPagoProveedorPage } from './pages/banco/ImprimirPagoProveedorPage';
import { ConciliacionesPage } from './pages/banco/ConciliacionesPage';
import { MantenimientoCatalogosHubPage } from './pages/mantenimiento/MantenimientoCatalogosHubPage';
import { ClasificacionesServicioPage } from './pages/mantenimiento/ClasificacionesServicioPage';
import { CatalogoServiciosPage } from './pages/mantenimiento/CatalogoServiciosPage';
import { MecanicosPage } from './pages/mantenimiento/MecanicosPage';
import { PlanesServicioPage } from './pages/mantenimiento/PlanesServicioPage';
import { ReportesFallaPage } from './pages/mantenimiento/ReportesFallaPage';
import { OrdenesServicioPage } from './pages/mantenimiento/OrdenesServicioPage';
import { ServiciosProgramadosPage } from './pages/mantenimiento/ServiciosProgramadosPage';
import { ChecklistFisicomecanicoPage } from './pages/mantenimiento/ChecklistFisicomecanicoPage';
import { ProgramaPage } from './pages/ProgramaPage';
import { MonitoreoCentroControlPage } from './pages/monitoreo/MonitoreoCentroControlPage';
import { MonitoreoViajesPage } from './pages/monitoreo/MonitoreoViajesPage';
import { MonitoreoMapaPage } from './pages/monitoreo/MonitoreoMapaPage';
import { MonitoreoBitacoraPage } from './pages/monitoreo/MonitoreoBitacoraPage';
import { MonitoreoIncidenciasPage } from './pages/monitoreo/MonitoreoIncidenciasPage';
import { MonitoreoAlertasPage } from './pages/monitoreo/MonitoreoAlertasPage';
import { MonitoreoComunicacionPage } from './pages/monitoreo/MonitoreoComunicacionPage';
import { MonitoreoReportesHubPage } from './pages/monitoreo/MonitoreoReportesHubPage';
import { MonitoreoReporteIncidenciasPage } from './pages/monitoreo/MonitoreoReporteIncidenciasPage';
import { MonitoreoReporteAlertasPage } from './pages/monitoreo/MonitoreoReporteAlertasPage';
import { ImprimirReporteMonitoreoPage } from './pages/monitoreo/ImprimirReporteMonitoreoPage';
import { ViajesDelDiaPage } from './pages/ViajesDelDiaPage';
import { AeropuertoPage } from './pages/AeropuertoPage';
import { ReportesPage } from './pages/ReportesPage';
import { ReportesOperativosPage } from './pages/ReportesOperativosPage';
import { ReportesTraficoHubPage } from './pages/reportes-trafico/ReportesTraficoHubPage';
import { ListadoViajesReportPage } from './pages/reportes-trafico/ListadoViajesReportPage';
import { ViajesPendientesFacturarReportPage } from './pages/reportes-trafico/ViajesPendientesFacturarReportPage';
import { IngresosPorOperadorReportPage } from './pages/reportes-trafico/IngresosPorOperadorReportPage';
import { ViajesPorUnidadReportPage } from './pages/reportes-trafico/ViajesPorUnidadReportPage';
import { EstatusViajesReportPage } from './pages/reportes-trafico/EstatusViajesReportPage';
import { ImprimirReporteTraficoPage } from './pages/reportes-trafico/ImprimirReporteTraficoPage';
import { ConfiguracionPage } from './pages/configuracion/ConfiguracionPage';

function App() {
  return (
    <ThemeProvider>
    <DataProvider>
      <AuthProvider>
        <HashRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/restablecer-password" element={<RestablecerPasswordPage />} />
            <Route element={<RequireAuth />}>
              <Route element={<SuperAdminLayout />}>
                <Route path="/superadmin" element={<EmpresasSection />} />
              </Route>

              <Route element={<AppLayout />}>
                <Route path="/" element={<Dashboard />} />

                <Route element={<RequirePermission modulo="Catalogos" />}>
                  <Route path="/catalogos" element={<CatalogosHubPage />} />
                  <Route path="/parque-vehicular" element={<ParqueVehicularPage />} />
                  <Route path="/catalogos/clientes" element={<ClientesPage />} />
                  <Route path="/catalogos/destinatarios" element={<DestinatariosPage />} />
                  <Route path="/catalogos/proveedores" element={<ProveedoresPage />} />
                  <Route path="/catalogos/constancia-fiscal" element={<ConstanciaFiscalPage />} />
                  <Route path="/catalogos/cuentas-bancarias" element={<CuentasBancariasPage />} />
                  <Route path="/catalogos/estatus-viaje" element={<EstatusViajePage />} />
                  <Route path="/catalogos/estatus-unidad" element={<EstatusUnidadPage />} />
                  <Route path="/catalogos/clasificaciones-viaje" element={<ClasificacionesViajePage />} />
                  <Route path="/catalogos/grupos-unidad" element={<GruposUnidadPage />} />
                  <Route path="/catalogos/tipos-viaje" element={<TiposViajePage />} />
                  <Route path="/catalogos/clasificaciones-operador" element={<ClasificacionesOperadorPage />} />
                  <Route path="/catalogos/conceptos-facturacion" element={<ConceptosFacturacionPage />} />
                  <Route path="/catalogos/rutas" element={<RutasPage />} />
                  <Route path="/catalogos/unidades" element={<UnidadesPage />} />
                  <Route path="/catalogos/remolques" element={<RemolquesPage />} />
                  <Route path="/catalogos/operadores" element={<OperadoresPage />} />
                </Route>

                <Route element={<RequirePermission modulo="Viajes" />}>
                  <Route path="/viajes" element={<ViajesPage />} />
                  <Route path="/gastos-viaje" element={<GastosViajePage />} />
                  <Route path="/viajes-del-dia" element={<ViajesDelDiaPage />} />
                  <Route path="/aeropuerto" element={<AeropuertoPage />} />
                  <Route path="/trafico/reportes" element={<ReportesTraficoHubPage />} />
                  <Route path="/trafico/reportes/listado-viajes" element={<ListadoViajesReportPage />} />
                  <Route path="/trafico/reportes/pendientes-facturar" element={<ViajesPendientesFacturarReportPage />} />
                  <Route path="/trafico/reportes/ingresos-operador" element={<IngresosPorOperadorReportPage />} />
                  <Route path="/trafico/reportes/viajes-unidad" element={<ViajesPorUnidadReportPage />} />
                  <Route path="/trafico/reportes/estatus-viajes" element={<EstatusViajesReportPage />} />
                </Route>

                <Route element={<RequirePermission modulo="Facturacion" />}>
                  <Route path="/facturacion" element={<FacturacionPage />} />
                  <Route path="/facturacion/por-viaje" element={<FacturacionPorViajePage />} />
                  <Route path="/facturacion/por-concepto" element={<FacturacionPorConceptoPage />} />
                </Route>

                <Route element={<RequirePermission modulo="Cobranza" />}>
                  <Route path="/cobranza/complementos-pago" element={<CobranzaComplementosPagoPage />} />
                  <Route path="/cobranza/notas-credito" element={<CobranzaNotasCreditoPage />} />
                  <Route path="/cobranza/estados-cuenta" element={<CobranzaEstadosCuentaPage />} />
                </Route>

                <Route element={<RequirePermission modulo="Banco" />}>
                  <Route path="/banco/movimientos" element={<MovimientosBancariosPage />} />
                  <Route path="/banco/cuentas-por-pagar" element={<CuentasPorPagarPage />} />
                  <Route path="/banco/conciliaciones" element={<ConciliacionesPage />} />
                </Route>

                <Route element={<RequirePermission modulo="Mantenimiento" />}>
                  <Route path="/mantenimiento/catalogos" element={<MantenimientoCatalogosHubPage />} />
                  <Route path="/mantenimiento/catalogos/clasificaciones-servicio" element={<ClasificacionesServicioPage />} />
                  <Route path="/mantenimiento/catalogos/servicios" element={<CatalogoServiciosPage />} />
                  <Route path="/mantenimiento/catalogos/mecanicos" element={<MecanicosPage />} />
                  <Route path="/mantenimiento/catalogos/planes-servicio" element={<PlanesServicioPage />} />
                  <Route path="/mantenimiento/reportes-falla" element={<ReportesFallaPage />} />
                  <Route path="/mantenimiento/ordenes-servicio" element={<OrdenesServicioPage />} />
                  <Route path="/mantenimiento/servicios-programados" element={<ServiciosProgramadosPage />} />
                  <Route path="/mantenimiento/checklist" element={<ChecklistFisicomecanicoPage />} />
                </Route>

                <Route element={<RequirePermission modulo="Programa" />}>
                  <Route path="/programa" element={<ProgramaPage />} />
                </Route>

                <Route element={<RequirePermission modulo="Monitoreo" />}>
                  <Route path="/monitoreo" element={<MonitoreoCentroControlPage />} />
                  <Route path="/monitoreo/viajes" element={<MonitoreoViajesPage />} />
                  <Route path="/monitoreo/mapa" element={<MonitoreoMapaPage />} />
                  <Route path="/monitoreo/bitacora" element={<MonitoreoBitacoraPage />} />
                  <Route path="/monitoreo/incidencias" element={<MonitoreoIncidenciasPage />} />
                  <Route path="/monitoreo/alertas" element={<MonitoreoAlertasPage />} />
                  <Route path="/monitoreo/comunicacion" element={<MonitoreoComunicacionPage />} />
                  <Route path="/monitoreo/reportes" element={<MonitoreoReportesHubPage />} />
                  <Route path="/monitoreo/reportes/incidencias" element={<MonitoreoReporteIncidenciasPage />} />
                  <Route path="/monitoreo/reportes/alertas" element={<MonitoreoReporteAlertasPage />} />
                </Route>

                <Route element={<RequirePermission modulo="Reportes" />}>
                  <Route path="/reportes" element={<ReportesPage />} />
                  <Route path="/reportes-operativos" element={<ReportesOperativosPage />} />
                </Route>

                <Route element={<RequirePermission modulo="Configuracion" />}>
                  <Route path="/configuracion" element={<ConfiguracionPage />} />
                </Route>
              </Route>

              <Route path="/viajes/imprimir/:id" element={<ImprimirViajePage />} />
              <Route path="/gastos-viaje/imprimir/:id" element={<ImprimirGastoViajePage />} />
              <Route path="/parque-vehicular/imprimir" element={<ImprimirParqueVehicularPage />} />
              <Route path="/facturacion/imprimir/:id" element={<ImprimirFacturaPage />} />
              <Route path="/cobranza/complementos-pago/imprimir/:id" element={<ImprimirPagoClientePage />} />
              <Route path="/cobranza/notas-credito/imprimir/:id" element={<ImprimirNotaCreditoPage />} />
              <Route path="/cobranza/estados-cuenta/imprimir/:clienteId" element={<ImprimirEstadoCuentaPage />} />
              <Route path="/banco/cuentas-por-pagar/imprimir/:id" element={<ImprimirPagoProveedorPage />} />
              <Route path="/trafico/reportes/imprimir/:tipo" element={<ImprimirReporteTraficoPage />} />
              <Route path="/monitoreo/reportes/imprimir/:tipo" element={<ImprimirReporteMonitoreoPage />} />
            </Route>
          </Routes>
        </HashRouter>
      </AuthProvider>
    </DataProvider>
    </ThemeProvider>
  );
}

export default App;
