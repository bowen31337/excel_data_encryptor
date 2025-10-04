/**
 * Main App Component
 * Integrates all components and manages global state
 */

import { InboxOutlined, LockOutlined } from '@ant-design/icons';
import {
  Alert,
  Layout as AntLayout,
  Button,
  Card,
  Col,
  Descriptions,
  Progress,
  Row,
  Space,
  Typography,
  Upload,
} from 'antd';
import type { UploadProps } from 'antd';
import { useState } from 'react';
import { findTargetColumns, hasTargetColumns } from './services/columnMatcher';
import { hashValue } from './services/encryptionService';
import {
  downloadFile,
  generateCSV,
  generateDownloadFilename,
  generateExcel,
} from './services/fileGenerator';
import { detectFileType, parseCSV, parseExcel } from './services/fileParser';
import type { ColumnMapping } from './types/encryption.types';
import type { ParsedData } from './types/file.types';
import { validateFile } from './utils/validation';

const { Header, Content } = AntLayout;
const { Title, Paragraph } = Typography;
const { Dragger } = Upload;

type AppStateType = 'IDLE' | 'PARSING' | 'READY' | 'ENCRYPTING' | 'COMPLETE' | 'ERROR';

function App() {
  const [state, setState] = useState<AppStateType>('IDLE');
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([]);
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [stats, setStats] = useState({ totalRows: 0, encryptedCells: 0, duration: 0 });

  // Detect touch device for mobile-optimized UI
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  // Detect mobile viewport
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  const handleFileUpload: UploadProps['customRequest'] = async ({ file: uploadFile }) => {
    const fileObj = uploadFile as File;

    // Validate file
    const validation = validateFile(fileObj);
    if (!validation.isValid) {
      setState('ERROR');
      setErrorMessage(validation.errors[0] || 'File validation failed');
      return;
    }

    setState('PARSING');
    setFile(fileObj);
    setErrorMessage('');

    try {
      // Detect and parse file
      const fileType = detectFileType(fileObj);
      let parsed: ParsedData;

      if (fileType === 'excel') {
        parsed = await parseExcel(fileObj);
      } else if (fileType === 'csv') {
        parsed = await parseCSV(fileObj);
      } else {
        throw new Error('Unsupported file format');
      }

      setParsedData(parsed);

      // Find target columns
      const mappings = findTargetColumns(parsed.headers);
      setColumnMappings(mappings);

      // Check if any target columns exist
      if (!hasTargetColumns(parsed.headers)) {
        setState('ERROR');
        setErrorMessage(
          'No target columns found. File must contain First Name, Last Name, Mobile, Phone, or Email (or variations like FirstName, E-mail, Phone Number, etc.)'
        );
        return;
      }

      setState('READY');
    } catch (error) {
      setState('ERROR');
      setErrorMessage(error instanceof Error ? error.message : 'Failed to parse file');
    }
  };

  const handleEncrypt = async () => {
    if (!parsedData || !file) return;

    setState('ENCRYPTING');
    setProgress(0);

    const startTime = Date.now();
    let encryptedCount = 0;

    try {
      // Create a copy of the data for encryption
      const encryptedRows = [...parsedData.rows];
      const totalCells = parsedData.rows.length * columnMappings.filter((m) => m.isTarget).length;
      let processedCells = 0;

      // Process rows in chunks for better performance
      const chunkSize = 100;
      for (let i = 0; i < encryptedRows.length; i += chunkSize) {
        const chunkEnd = Math.min(i + chunkSize, encryptedRows.length);

        // Process chunk
        for (let rowIdx = i; rowIdx < chunkEnd; rowIdx++) {
          const row = encryptedRows[rowIdx];
          if (!row) continue;

          // Encrypt target columns in this row
          for (const mapping of columnMappings) {
            if (mapping.isTarget) {
              const cellValue = row[mapping.columnIndex];

              // Only encrypt non-empty cells
              if (cellValue !== undefined && cellValue !== null && cellValue !== '') {
                const hash = await hashValue(String(cellValue));
                row[mapping.columnIndex] = hash;
                encryptedCount++;
              }

              processedCells++;
              setProgress(Math.round((processedCells / totalCells) * 100));
            }
          }
        }

        // Yield to browser
        await new Promise((resolve) => setTimeout(resolve, 0));
      }

      // Generate encrypted file
      const encryptedData: ParsedData = {
        ...parsedData,
        rows: encryptedRows,
      };

      const fileType = detectFileType(file);
      const blob =
        fileType === 'excel' ? generateExcel(encryptedData, file.name) : generateCSV(encryptedData);

      const filename = generateDownloadFilename(file.name);

      // Download file
      downloadFile(blob, filename);

      // Update stats
      const duration = Date.now() - startTime;
      setStats({
        totalRows: parsedData.rows.length,
        encryptedCells: encryptedCount,
        duration,
      });

      setState('COMPLETE');
      setProgress(100);
    } catch (error) {
      setState('ERROR');
      setErrorMessage(error instanceof Error ? error.message : 'Encryption failed');
    }
  };

  const handleReset = () => {
    setState('IDLE');
    setFile(null);
    setParsedData(null);
    setColumnMappings([]);
    setProgress(0);
    setErrorMessage('');
    setStats({ totalRows: 0, encryptedCells: 0, duration: 0 });
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Directly process the file like handleFileUpload does
      const fileObj = selectedFile;

      // Validate file
      const validation = validateFile(fileObj);
      if (!validation.isValid) {
        setState('ERROR');
        setErrorMessage(validation.errors[0] || 'File validation failed');
        return;
      }

      setState('PARSING');
      setFile(fileObj);
      setErrorMessage('');

      try {
        // Detect and parse file
        const fileType = detectFileType(fileObj);
        let parsed: ParsedData;

        if (fileType === 'excel') {
          parsed = await parseExcel(fileObj);
        } else if (fileType === 'csv') {
          parsed = await parseCSV(fileObj);
        } else {
          throw new Error('Unsupported file format');
        }

        setParsedData(parsed);

        // Find target columns
        const mappings = findTargetColumns(parsed.headers);
        setColumnMappings(mappings);

        // Check if any target columns exist
        if (!hasTargetColumns(parsed.headers)) {
          setState('ERROR');
          setErrorMessage(
            'No target columns found. File must contain First Name, Last Name, Mobile, Phone, or Email (or variations like FirstName, E-mail, Phone Number, etc.)'
          );
          return;
        }

        setState('READY');
      } catch (error) {
        setState('ERROR');
        setErrorMessage(error instanceof Error ? error.message : 'Failed to parse file');
      }
    }
  };

  return (
    <AntLayout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      <Header
        style={{ background: '#fff', padding: '0 50px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
      >
        <Space align="center" style={{ height: '100%' }}>
          <LockOutlined style={{ fontSize: 24, color: '#1890ff' }} />
          <Title level={3} style={{ margin: 0 }}>
            Excel Data Encryptor
          </Title>
        </Space>
      </Header>

      <Content
        style={{
          padding: isMobile ? '20px' : '50px',
          maxWidth: 1200,
          margin: '0 auto',
          width: '100%',
        }}
      >
        <Row gutter={[16, 16]} justify="center">
          <Col xs={24} md={20} lg={16}>
            <Card>
              <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <div>
                  <Title level={4}>Encrypt Sensitive Data in Excel/CSV Files</Title>
                  <Paragraph>
                    Upload an Excel (.xlsx, .xls) or CSV file to encrypt sensitive columns (First
                    Name, Last Name, Email, Mobile, Phone) using SHA-256 hashing. All processing
                    happens in your browser - no data is sent to any server.
                  </Paragraph>
                </div>

                <Alert
                  message="Important Notes"
                  description={
                    <>
                      <li>SHA-256 is a one-way hash. Encrypted data cannot be decrypted.</li>
                      <li>
                        All processing is done client-side. Your data never leaves your browser.
                      </li>
                      <li>Maximum file size: 100MB</li>
                    </>
                  }
                  type="info"
                  showIcon
                />

                {state === 'ERROR' && (
                  <Alert
                    message="Error"
                    description={errorMessage}
                    type="error"
                    showIcon
                    closable
                    onClose={() => setState('IDLE')}
                  />
                )}

                {(state === 'IDLE' || state === 'ERROR') && (
                  <>
                    {isTouchDevice ? (
                      <div
                        style={{
                          textAlign: 'center',
                          padding: '40px 20px',
                          border: '2px dashed #d9d9d9',
                          borderRadius: '8px',
                        }}
                      >
                        <p className="ant-upload-drag-icon">
                          <InboxOutlined />
                        </p>
                        <p className="ant-upload-text">Tap to select a file</p>
                        <p className="ant-upload-hint">
                          Support for Excel (.xlsx, .xls) and CSV files up to 100MB
                        </p>
                        <input
                          type="file"
                          accept=".csv,.xlsx,.xls"
                          onChange={handleFileInputChange}
                          style={{
                            marginTop: '16px',
                            width: '100%',
                            padding: '10px',
                            fontSize: '16px',
                            minHeight: '44px',
                          }}
                          data-testid="upload-input"
                        />
                      </div>
                    ) : (
                      <Dragger
                        name="file"
                        multiple={false}
                        accept=".csv,.xlsx,.xls"
                        customRequest={handleFileUpload}
                        showUploadList={false}
                        data-testid="upload-area"
                      >
                        <p className="ant-upload-drag-icon">
                          <InboxOutlined />
                        </p>
                        <p className="ant-upload-text">Click or drag file to this area to upload</p>
                        <p className="ant-upload-hint">
                          Support for Excel (.xlsx, .xls) and CSV files up to 100MB
                        </p>
                      </Dragger>
                    )}
                  </>
                )}

                {state === 'PARSING' && <Alert message="Parsing file..." type="info" showIcon />}

                {(state === 'READY' || state === 'ENCRYPTING' || state === 'COMPLETE') &&
                  file &&
                  parsedData && (
                    <Card title="File Information" size="small">
                      <Descriptions column={1}>
                        <Descriptions.Item label="File Name" data-testid="file-name">
                          {file.name}
                        </Descriptions.Item>
                        <Descriptions.Item label="File Size" data-testid="file-size">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </Descriptions.Item>
                        <Descriptions.Item label="Rows">
                          {parsedData.rowCount.toLocaleString()}
                        </Descriptions.Item>
                        <Descriptions.Item label="Columns to Encrypt">
                          {columnMappings
                            .filter((m) => m.isTarget)
                            .map((m) => m.originalName)
                            .join(', ')}
                        </Descriptions.Item>
                      </Descriptions>
                    </Card>
                  )}

                {state === 'ENCRYPTING' && (
                  <div>
                    <Paragraph>Encrypting data...</Paragraph>
                    <Progress percent={progress} status="active" />
                  </div>
                )}

                {state === 'COMPLETE' && (
                  <Alert
                    message="Success!"
                    description={`File encrypted successfully! ${stats.totalRows.toLocaleString()} rows processed, ${stats.encryptedCells.toLocaleString()} cells encrypted in ${(stats.duration / 1000).toFixed(2)}s.`}
                    type="success"
                    showIcon
                  />
                )}

                {state === 'READY' && (
                  <Button
                    type="primary"
                    size="large"
                    onClick={handleEncrypt}
                    data-testid="encrypt-button"
                    block
                  >
                    Encrypt & Download
                  </Button>
                )}

                {(state === 'COMPLETE' || state === 'ERROR') && (
                  <Button onClick={handleReset} block>
                    Upload Another File
                  </Button>
                )}
              </Space>
            </Card>
          </Col>
        </Row>
      </Content>
    </AntLayout>
  );
}

export default App;
