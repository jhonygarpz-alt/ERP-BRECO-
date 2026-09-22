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
import { ProgramaPage } from './pages/ProgramaPage';
import { EntregaTurnoPage } from './pages/EntregaTurnoPage';
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
                </Route>

                <Route element={<RequirePermission modulo="Programa" />}>
                  <Route path="/programa" element={<ProgramaPage />} />
                </Route>

                <Route element={<RequirePermission modulo="EntregaTurno" />}>
                  <Route path="/entrega-turno" element={<EntregaTurnoPage />} />
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
              <Route path="/trafico/reportes/imprimir/:tipo" element={<ImprimirReporteTraficoPage />} />
            </Route>
          </Routes>
        </HashRouter>
      </AuthProvider>
    </DataProvider>
    </ThemeProvider>
  );
}

export default App;
