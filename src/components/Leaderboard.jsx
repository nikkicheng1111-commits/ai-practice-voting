import { useState, useEffect } from 'react';
import { getLeaderboard } from '../store';

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getLeaderboard()
      .then(data => {
        if (!cancelled) {
          setLeaderboard(data);
          setLoading(false);
        }
      })
      .catch(err => {
        if (!cancelled) {
          setError(err.message);
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, []);

  if (loading) return <div className="empty-state">加载中...</div>;
  if (error) return <div className="empty-state">加载失败: {error}</div>;

  if (leaderboard.length === 0) {
    return <div className="empty-state">暂无案例，请先在"打分"页添加案例</div>;
  }

  return (
    <div className="leaderboard">
      <table>
        <thead>
          <tr>
            <th>排名</th>
            <th>案例名称</th>
            <th>总评分</th>
            <th>实用性</th>
            <th>效果</th>
            <th>可复制性</th>
            <th>评分人数</th>
          </tr>
        </thead>
        <tbody>
          {leaderboard.map((item, index) => (
            <tr key={item.id} className={index < 3 ? `rank-${index + 1}` : ''}>
              <td className="rank">{index + 1}</td>
              <td className="case-name">
                {item.name}
                {item.description && <span className="desc">{item.description}</span>}
              </td>
              <td className="total-score">{item.avgTotal.toFixed(2)}</td>
              <td>{item.avgUsefulness.toFixed(2)}</td>
              <td>{item.avgImpact.toFixed(2)}</td>
              <td>{item.avgReproducibility.toFixed(2)}</td>
              <td>{item.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
