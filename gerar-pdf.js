import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function gerarPDF() {
  const htmlPath = path.join(__dirname, 'REQUISITOS_MVP_ERP_MORAIS.html');
  const pdfPath = path.join(__dirname, 'REQUISITOS_MVP_ERP_MORAIS.pdf');

  if (!fs.existsSync(htmlPath)) {
    console.error('❌ Arquivo HTML não encontrado:', htmlPath);
    process.exit(1);
  }

  console.log('🚀 Iniciando geração do PDF...');
  console.log('📄 HTML:', htmlPath);
  console.log('📑 PDF:', pdfPath);

  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    
    // Ler o conteúdo HTML
    const htmlContent = fs.readFileSync(htmlPath, 'utf8');
    
    // Configurar a página
    await page.setContent(htmlContent, {
      waitUntil: 'networkidle0'
    });

    // Gerar PDF com configurações otimizadas
    await page.pdf({
      path: pdfPath,
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm'
      },
      preferCSSPageSize: false,
      displayHeaderFooter: false
    });

    await browser.close();

    console.log('✅ PDF gerado com sucesso!');
    console.log('📁 Localização:', pdfPath);
    
  } catch (error) {
    console.error('❌ Erro ao gerar PDF:', error.message);
    process.exit(1);
  }
}

gerarPDF();
