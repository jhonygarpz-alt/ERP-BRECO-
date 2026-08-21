import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { DataProvider } from './lib/DataContext';
import { AppLayout } from './components/layout/AppLayout';
import { Dashboard } from './pages/Dashboard';
import { ClientesPage } from './pages/catalogos/ClientesPage';
import { UnidadesPage } from './pages/catalogos/UnidadesPage';
import { CajasPage } from './pages/catalogos/CajasPage';
import { OperadoresPage } from './pages/catalogos/OperadoresPage';
import { ViajesPage } from './pages/ViajesPage';
import { FacturacionPage } from './pages/FacturacionPage';
import { ProgramaPage } from './pages/ProgramaPage';

function App() {
  return (
    <DataProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/catalogos/clientes" element={<ClientesPage />} />
            <Route path="/catalogos/unidades" element={<UnidadesPage />} />
            <Route path="/catalogos/cajas" element={<CajasPage />} />
            <Route path="/catalogos/operadores" element={<OperadoresPage />} />
            <Route path="/viajes" element={<ViajesPage />} />
            <Route path="/facturacion" element={<FacturacionPage />} />
            <Route path="/programa" element={<ProgramaPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </DataProvider>
  );
}

export default App;
