import { HashRouter, Route, Routes } from 'react-router-dom';
import { DataProvider } from './lib/DataContext';
import { AuthProvider } from './lib/AuthContext';
import { ThemeProvider } from './lib/ThemeContext';
import { AppLayout } from './components/layout/AppLayout';
import { RequireAuth } from './components/auth/RequireAuth';
import { RequirePermission } from './components/auth/RequirePermission';
import { LoginPage } from './pages/LoginPage';
import { Dashboard } from './pages/Dashboard';
import { ClientesPage } from './pages/catalogos/ClientesPage';
import { UnidadesPage } from './pages/catalogos/UnidadesPage';
import { CajasPage } from './pages/catalogos/CajasPage';
import { OperadoresPage } from './pages/catalogos/OperadoresPage';
import { ViajesPage } from './pages/ViajesPage';
import { FacturacionPage } from './pages/FacturacionPage';
import { ProgramaPage } from './pages/ProgramaPage';
import { EntregaTurnoPage } from './pages/EntregaTurnoPage';
import { ViajesDelDiaPage } from './pages/ViajesDelDiaPage';
import { AeropuertoPage } from './pages/AeropuertoPage';
import { ReportesPage } from './pages/ReportesPage';
import { ReportesOperativosPage } from './pages/ReportesOperativosPage';
import { ConfiguracionPage } from './pages/configuracion/ConfiguracionPage';

function App() {
  return (
    <ThemeProvider>
    <DataProvider>
      <AuthProvider>
        <HashRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<RequireAuth />}>
              <Route element={<AppLayout />}>
                <Route path="/" element={<Dashboard />} />

                <Route element={<RequirePermission modulo="Catalogos" />}>
                  <Route path="/catalogos/clientes" element={<ClientesPage />} />
                  <Route path="/catalogos/unidades" element={<UnidadesPage />} />
                  <Route path="/catalogos/cajas" element={<CajasPage />} />
                  <Route path="/catalogos/operadores" element={<OperadoresPage />} />
                </Route>

                <Route element={<RequirePermission modulo="Viajes" />}>
                  <Route path="/viajes" element={<ViajesPage />} />
                  <Route path="/viajes-del-dia" element={<ViajesDelDiaPage />} />
                  <Route path="/aeropuerto" element={<AeropuertoPage />} />
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
            </Route>
          </Routes>
        </HashRouter>
      </AuthProvider>
    </DataProvider>
    </ThemeProvider>
  );
}

export default App;
