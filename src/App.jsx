import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import Layout from './components/Layout/Layout';
import ImageGeneration from './pages/ImageGeneration/ImageGeneration';
import AdCopyGeneration from './pages/AdCopyGeneration/AdCopyGeneration';
import ImagePrompt from './pages/ImagePrompt/ImagePrompt';
import Test from './pages/Test/Test';
import Login from './pages/Login/Login';
import Signup from './pages/Login/Signup';
import ImageAttachment from './pages/ImageAttachment/ImageAttachment';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/image-generation" replace />} />
          <Route path="image-generation" element={<ImageGeneration />} />
          <Route path="adcopy-generation" element={<AdCopyGeneration />} />
          <Route path="image-prompt" element={<ImagePrompt />} />
          <Route path="test" element={<Test />} />
          <Route path="login" element={<Login />} />
          <Route path="login/signup" element={<Signup />} />
          <Route path="image-attachment" element={<ImageAttachment />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
