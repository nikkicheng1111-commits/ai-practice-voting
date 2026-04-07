import { useState, useEffect } from 'react';
import { getCases, addScore, getUserScore, addCase, deleteCase } from '../store';

const DIMENSIONS = [
  { key: 'usefulness', label: '实用性', hint: '能不能直接用' },
  { key: 'impact', label: '效果', hint: '是否有明显ROI' },
  { key: 'reproducibility', label: '可复制性', hint: '团队能否复用' },
];

function StarRating({ value, onChange, label }) {
  return (
    <div className="star-rating">
      <span className="dimension-label">{label}</span>
      <div className="stars">
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            className={`star ${n <= value ? 'active' : ''}`}
            onClick={() => onChange(n)}
            type="button"
          >
            {n <= value ? '\u2605' : '\u2606'}
          </button>
        ))}
      </div>
    </div>
  );
}

function CaseCard({ caseItem, onScored }) {
  const [existing, setExisting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [scores, setScores] = useState({
    usefulness: 0,
    impact: 0,
    reproducibility: 0,
  });
  const [saved, setSaved] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getUserScore(caseItem.id)
      .then(result => {
        if (!cancelled) {
          setExisting(result);
          if (result) {
            setScores({
              usefulness: result.usefulness,
              impact: result.impact,
              reproducibility: result.reproducibility,
            });
            setSaved(true);
          }
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [caseItem.id]);

  const allScored = scores.usefulness > 0 && scores.impact > 0 && scores.reproducibility > 0;

  const handleSubmit = async () => {
    if (!allScored || submitting) return;
    setSubmitting(true);
    try {
      await addScore(caseItem.id, scores.usefulness, scores.impact, scores.reproducibility);
      setSaved(true);
      onScored();
    } catch (err) {
      alert('保存失败: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="case-card">加载中...</div>;
  }

  return (
    <div className="case-card">
      <h3>{caseItem.name}</h3>
      {caseItem.description && <p className="case-desc">{caseItem.description}</p>}
      <div className="dimensions">
        {DIMENSIONS.map(d => (
          <StarRating
            key={d.key}
            label={`${d.label}（${d.hint}）`}
            value={scores[d.key]}
            onChange={v => {
              setScores(prev => ({ ...prev, [d.key]: v }));
              setSaved(false);
            }}
          />
        ))}
      </div>
      <button
        className="submit-btn"
        onClick={handleSubmit}
        disabled={!allScored || submitting}
      >
        {submitting ? '保存中...' : saved ? '已保存（可修改）' : '提交评分'}
      </button>
      {saved && <span className="saved-badge">已评分</span>}
    </div>
  );
}

export default function Scoring() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = async () => {
    setLoading(true);
    try {
      const data = await getCases();
      setCases(data);
    } catch (err) {
      alert('加载案例失败: ' + err.message);
    } finally {
      setLoading(false);
    }
    setRefreshKey(k => k + 1);
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      await addCase(newName.trim(), newDesc.trim());
      setNewName('');
      setNewDesc('');
      await refresh();
    } catch (err) {
      alert('添加失败: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('确定删除该案例？')) return;
    try {
      await deleteCase(id);
      await refresh();
    } catch (err) {
      alert('删除失败: ' + err.message);
    }
  };

  return (
    <div className="scoring">
      <form className="add-case-form" onSubmit={handleAdd}>
        <input
          type="text"
          placeholder="案例名称（必填）"
          value={newName}
          onChange={e => setNewName(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="案例描述（可选）"
          value={newDesc}
          onChange={e => setNewDesc(e.target.value)}
        />
        <button type="submit">新增案例</button>
      </form>

      <div className="case-list" key={refreshKey}>
        {loading ? (
          <div className="empty-state">加载中...</div>
        ) : cases.length === 0 ? (
          <div className="empty-state">暂无案例，请先添加</div>
        ) : (
          cases.map(c => (
            <div key={c.id} className="case-wrapper">
              <CaseCard caseItem={c} onScored={refresh} />
              <button className="delete-btn" onClick={() => handleDelete(c.id)}>删除</button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
