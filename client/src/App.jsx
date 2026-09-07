import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LaunchPage from './pages/LaunchPage';
import LEDPage from './pages/LEDPage';
import QRPage from './pages/QRPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* The default route "/" is now the LED screen */}
        <Route path="/" element={<LEDPage />} />
        <Route path="/led" element={<LEDPage />} />
        
        {/* The phone route, triggered by scanning the QR code */}
        <Route path="/launch" element={<LaunchPage />} />
        
        {/* Keeping this just in case you ever want to test the QR in isolation */}
        <Route path="/qr" element={<QRPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;