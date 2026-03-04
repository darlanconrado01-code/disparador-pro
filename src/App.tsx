import { useState, useMemo, useEffect } from 'react';
import { LayoutDashboard, FileText, Search, RefreshCcw, Plus, Trash2, Clock } from 'lucide-react';

const WEBHOOK_URL = 'https://n8n.canvazap.com.br/webhook/7b88acd7-af62-4433-9c11-cf423e3d00b5';

function App() {
  const [activeTab, setActiveTab] = useState<'disparador' | 'relatorios'>('disparador');
  const [rawData, setRawData] = useState('');
  const [message, setMessage] = useState('Olá {{Nome}}, como vai?');
  const [nomeCampanha, setNomeCampanha] = useState('Campanha Premium 2025');
  const [nomeEmpresa, setNomeEmpresa] = useState('');
  const [delaySeconds, setDelaySeconds] = useState(5);
  const [imageLinks, setImageLinks] = useState<string[]>(['']);
  const [nameColumnIndex, setNameColumnIndex] = useState(0);
  const [phoneColumnIndex, setPhoneColumnIndex] = useState(1);
  const [sending, setSending] = useState(false);
  const [statuses, setStatuses] = useState<Record<number, string>>({});

  const [reports, setReports] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [searchReport, setSearchReport] = useState('');

  const allLines = useMemo(() => {
    return rawData.trim().split('\n').filter(l => l.trim() !== '').map(line => line.split('\t'));
  }, [rawData]);

  const headers = useMemo(() => {
    if (allLines.length > 0) {
      return allLines[0].map((h, i) => h.trim() || `Coluna ${i + 1}`);
    }
    return [];
  }, [allLines]);

  const dataRows = useMemo(() => {
    if (allLines.length > 1) {
      return allLines.slice(1);
    }
    return [];
  }, [allLines]);

  // Busca Clientes (Empresas) via Servidor local (/api/clientes)
  const fetchClients = async () => {
    try {
      const res = await fetch('/api/clientes');
      const data = await res.json();
      if (Array.isArray(data)) {
        setClients(data);
        if (data.length > 0 && !nomeEmpresa) {
          setNomeEmpresa(data[0].nome_empresa);
        }
      }
    } catch (e) {
      console.error('Erro ao buscar clientes:', e);
    }
  };

  // Busca Relatórios via Servidor local (/api/relatorios)
  const fetchReports = async () => {
    setLoadingReports(true);
    try {
      const res = await fetch('/api/relatorios');
      const data = await res.json();
      setReports(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Erro ao buscar relatórios:', e);
    } finally {
      setLoadingReports(false);
    }
  };

  useEffect(() => {
    fetchClients();
    if (activeTab === 'relatorios') fetchReports();
  }, [activeTab]);

  useEffect(() => {
    if (headers.length > 0) {
      const nameIdx = headers.findIndex(h => h.toLowerCase().includes('nome'));
      if (nameIdx !== -1) setNameColumnIndex(nameIdx);
      const phoneIdx = headers.findIndex(h => h.toLowerCase().includes('celular') || h.toLowerCase().includes('telefone') || h.toLowerCase().includes('whatsapp'));
      if (phoneIdx !== -1) setPhoneColumnIndex(phoneIdx);
    }
  }, [headers]);

  const handleAddImage = () => setImageLinks([...imageLinks, '']);
  const handleRemoveImage = (index: number) => {
    const newLinks = imageLinks.filter((_, i) => i !== index);
    setImageLinks(newLinks.length ? newLinks : ['']);
  };
  const handleImageChange = (index: number, value: string) => {
    const newLinks = [...imageLinks];
    newLinks[index] = value;
    setImageLinks(newLinks);
  };

  const formatMessage = (row: string[], rowHeaders: string[], msg: string) => {
    let formatted = msg;
    rowHeaders.forEach((header, index) => {
      const value = row[index] || '';
      formatted = formatted.replace(new RegExp(`{{${header}}}`, 'g'), value);
      if (header.toLowerCase().includes('nome')) {
        const primeiroNome = value.split(' ')[0];
        formatted = formatted.replace(/{{Primeiro_Nome}}/g, primeiroNome);
      }
    });
    return formatted;
  };

  const startMassSend = async () => {
    if (dataRows.length === 0) return;
    if (!nomeEmpresa) {
      alert('Selecione uma empresa antes de disparar.');
      return;
    }
    setSending(true);
    const validImages = imageLinks.filter(link => link.trim() !== '');

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      const phone = row[phoneColumnIndex]?.replace(/\D/g, '');
      const nome = row[nameColumnIndex] || '';
      const msgPersonalizada = formatMessage(row, headers, message);

      setStatuses(prev => ({ ...prev, [i]: 'Enviando' }));
      let statusProcessamento = 'Erro';

      try {
        const response = await fetch(WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            telefone: phone,
            nome: nome,
            mensagem: msgPersonalizada,
            empresa: nomeEmpresa,
            nome_campanha: nomeCampanha,
            imagens: validImages
          })
        });

        const n8nResult = await response.json().catch(() => ({}));
        if (response.ok && n8nResult.status !== 'error') {
          statusProcessamento = 'Enviado';
        }
      } catch (error) { console.error(error); }

      // Salva no Supabase via Servidor /api/disparos
      try {
        await fetch('/api/disparos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nome_campanha: nomeCampanha,
            empresa: nomeEmpresa,
            nome: nome,
            numero: phone,
            status: statusProcessamento
          })
        });
      } catch (error) { console.error('Erro ao salvar no Supabase:', error); }

      setStatuses(prev => ({ ...prev, [i]: statusProcessamento }));
      if (i < dataRows.length - 1) await new Promise(r => setTimeout(r, delaySeconds * 1000));
    }
    setSending(false);
    alert('Processo concluído!');
  };

  return (
    <div className="container">
      <nav>
        <button onClick={() => setActiveTab('disparador')} className={`nav-link ${activeTab === 'disparador' ? 'active' : ''}`}>
          <LayoutDashboard size={18} style={{ verticalAlign: 'middle', marginRight: '8px' }} /> DISPARADOR PRO
        </button>
        <button onClick={() => setActiveTab('relatorios')} className={`nav-link ${activeTab === 'relatorios' ? 'active' : ''}`}>
          <FileText size={18} style={{ verticalAlign: 'middle', marginRight: '8px' }} /> RELATÓRIOS GERAIS
        </button>
      </nav>

      {activeTab === 'disparador' ? (
        <div style={{ animation: 'fadeIn 0.5s ease' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px' }}>
            <h1 className="app-title" style={{ margin: 0 }}>marking<span style={{ color: 'var(--primary-accent)' }}>®</span> pro</h1>
            <span style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e', padding: '4px 12px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 'bold', border: '1px solid rgba(34,197,94,0.2)', letterSpacing: '1px' }}>LIVE EDITION</span>
          </div>

          <div className="card">
            <p className="section-title">01. Configurações Estratégicas</p>
            <div className="select-group">
              <div>
                <label className="select-label">Campanha</label>
                <input type="text" className="select-input" value={nomeCampanha} onChange={(e) => setNomeCampanha(e.target.value)} />
              </div>
              <div>
                <label className="select-label">Empresa (Puxando do Supabase)</label>
                <select className="select-input" value={nomeEmpresa} onChange={(e) => setNomeEmpresa(e.target.value)}>
                  <option value="">Selecione a Empresa...</option>
                  {clients.map((c, idx) => (
                    <option key={idx} value={c.nome_empresa}>{c.nome_empresa}</option>
                  ))}
                </select>
                {clients.length === 0 && <p style={{ fontSize: '0.7rem', color: '#ef4444', marginTop: '4px' }}>Nenhuma empresa encontrada no banco.</p>}
              </div>
              <div>
                <label className="select-label">Delay (Segundos)</label>
                <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', borderRadius: '12px', paddingRight: '12px' }}>
                  <input type="number" className="select-input" style={{ border: 'none', background: 'none' }} value={delaySeconds} onChange={(e) => setDelaySeconds(Number(e.target.value))} min="1" />
                  <Clock size={16} className="text-dim" />
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <p className="section-title">02. Dados da Base</p>
            <textarea className="textarea-input" value={rawData} onChange={(e) => setRawData(e.target.value)} placeholder="Cole aqui os dados da sua planilha..." style={{ minHeight: '150px' }} />
          </div>

          {headers.length > 0 && (
            <div className="card">
              <p className="section-title">03. Criação de Mensagem & Mídia</p>
              <div className="select-group">
                <div>
                  <label className="select-label">Coluna Telefone</label>
                  <select className="select-input" value={phoneColumnIndex} onChange={(e) => setPhoneColumnIndex(Number(e.target.value))}>
                    {headers.map((h, i) => <option key={i} value={i}>{h}</option>)}
                  </select>
                </div>
                <div>
                  <label className="select-label">Coluna Nome</label>
                  <select className="select-input" value={nameColumnIndex} onChange={(e) => setNameColumnIndex(Number(e.target.value))}>
                    {headers.map((h, i) => <option key={i} value={i}>{h}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label className="select-label">Variáveis Disponíveis</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  {headers.some(h => h.toLowerCase().includes('nome')) && (
                    <button className="variable-badge" onClick={() => setMessage(m => m + '{{Primeiro_Nome}}')} style={{ borderColor: 'var(--primary-accent)', color: 'var(--primary-accent)' }}>
                      {`{{Primeiro_Nome}}`}
                    </button>
                  )}
                  {headers.map((h, i) => (
                    <button key={i} className="variable-badge" onClick={() => setMessage(m => m + `{{${h}}}`)}>
                      {`{{${h}}}`}
                    </button>
                  ))}
                </div>
              </div>

              <textarea className="message-input" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Escreva sua mensagem personalizada..." style={{ minHeight: '120px', marginBottom: '24px' }} />

              <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <label className="select-label" style={{ margin: 0 }}>Canais de Imagem (URLs)</label>
                  <button onClick={handleAddImage} className="variable-badge" style={{ background: 'var(--primary-accent)', color: '#000', border: 'none' }}>
                    <Plus size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> ADICIONAR
                  </button>
                </div>
                {imageLinks.map((link, index) => (
                  <div key={index} style={{ display: 'flex', gap: '12px', marginBottom: '8px' }}>
                    <input type="url" className="select-input" value={link} onChange={(e) => handleImageChange(index, e.target.value)} placeholder="https://exemplo.com/imagem.png" />
                    <button onClick={() => handleRemoveImage(index)} style={{ padding: '0 16px', background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.3)', borderRadius: '12px', color: '#ef4444', cursor: 'pointer' }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button className="btn-green" onClick={startMassSend} disabled={sending || dataRows.length === 0}>
            {sending ? 'PROCESSANDO DISPARO...' : `INICIAR DISPARO EM MASSA (${dataRows.length})`}
          </button>

          {dataRows.length > 0 && (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr><th>Contato</th><th>Número</th><th>Preview</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {dataRows.map((row, i) => (
                    <tr key={i}>
                      <td><span style={{ fontWeight: '600' }}>{row[nameColumnIndex]}</span></td>
                      <td style={{ color: 'var(--text-dim)' }}>{row[phoneColumnIndex]?.replace(/\D/g, '')}</td>
                      <td style={{ fontSize: '0.75rem', color: 'var(--text-dim)', maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {formatMessage(row, headers, message)}
                      </td>
                      <td>
                        <span className="status-badge" style={{
                          background: statuses[i] === 'Enviado' ? 'rgba(34,197,94,0.1)' : statuses[i] === 'Erro' ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.05)',
                          color: statuses[i] === 'Enviado' ? '#22c55e' : statuses[i] === 'Erro' ? '#ef4444' : 'var(--text-dim)'
                        }}>
                          {statuses[i] || 'AGUARDANDO'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div style={{ animation: 'fadeIn 0.5s ease' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: '700' }}>Relatórios Gerais</h2>
            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ position: 'relative' }}>
                <Search style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} size={18} />
                <input type="text" placeholder="Buscar histórico..." className="select-input" style={{ paddingLeft: '48px', width: '350px' }} value={searchReport} onChange={(e) => setSearchReport(e.target.value)} />
              </div>
              <button onClick={fetchReports} className="select-input" style={{ width: 'auto', padding: '0 20px', background: 'var(--bg-card)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }} disabled={loadingReports}>
                <RefreshCcw size={16} className={loadingReports ? 'animate-spin' : ''} /> {loadingReports ? 'SINC...' : 'ATUALIZAR'}
              </button>
            </div>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr><th>Data</th><th>Campanha</th><th>Contato</th><th>Número</th><th>Empresa</th><th>Status</th></tr>
              </thead>
              <tbody>
                {reports.filter(r => r.nome?.toLowerCase().includes(searchReport.toLowerCase()) || r.nome_campanha?.toLowerCase().includes(searchReport.toLowerCase()) || r.numero?.includes(searchReport)).map((report) => (
                  <tr key={report.id}>
                    <td style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>{new Date(report.data).toLocaleString('pt-BR')}</td>
                    <td><span style={{ color: 'var(--primary-accent)', fontWeight: '600' }}>{report.nome_campanha}</span></td>
                    <td>{report.nome}</td>
                    <td style={{ fontFamily: 'monospace' }}>{report.numero}</td>
                    <td><span style={{ fontSize: '0.85rem' }}>{report.empresa}</span></td>
                    <td>
                      <span className="status-badge" style={{
                        background: report.status === 'Enviado' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                        color: report.status === 'Enviado' ? '#22c55e' : '#ef4444'
                      }}>
                        {report.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

export default App;
