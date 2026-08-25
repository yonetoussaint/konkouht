import { useState } from 'react';

interface CompetitionCreatorProps {
  onCreateCompetition: (title: string, edition: string, phase: string) => void;
}

export const CompetitionCreator: React.FC<CompetitionCreatorProps> = ({ onCreateCompetition }) => {
  const [title, setTitle] = useState('');
  const [edition, setEdition] = useState('');
  const [phase, setPhase] = useState('live');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim() && edition.trim()) {
      try {
        const newCompetition = {
          title: title.trim(),
          edition: edition.trim(),
          phase,
          niche: 'beauty',
          date_end: new Date().toISOString(),
        };
        onCreateCompetition(title.trim(), edition.trim(), phase);
        // Reset form
        setTitle('');
        setEdition('');
        setPhase('live');
      } catch (error) {
        setError('Erreur lors de la création');
      }
    }
  };

  return (
    <div className="competition-creator" style={{ 
      background: '#111', padding: 16, borderRadius: 8, marginBottom: 16,
      display: 'flex', gap: 12, alignItems: 'flex-start'
    }}>
      <h2 style={{ color: '#f2f2f2', fontFamily: 'Space Grotesk', fontSize: 18 }}>
        Créer une nouvelle compétition
      </h2>
      {error && <div style={{ color: '#ff7b7b' }}>{error}</div>}
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Titre"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          style={{
            flex: 1,
            height: 40,
            border: 'none',
            background: '#26262a',
            color: '#f2f2f2',
            padding: 8,
            borderRadius: 6,
            fontFamily: 'Inter',
          }}
        />
        <input
          type="text"
          placeholder="Édition"
          value={edition}
          onChange={(e) => setEdition(e.target.value)}
          required
          style={{
            flex: 1,
            height: 40,
            border: 'none',
            background: '#26262a',
            color: '#f2f2f2',
            padding: 8,
            borderRadius: 6,
            fontFamily: 'Inter',
          }}
        />
        <select
          value={phase}
          onChange={(e) => setPhase(e.target.value)}
          style={{
            flex: 1,
            height: 40,
            border: 'none',
            background: '#26262a',
            color: '#f2f2f2',
            padding: 8,
            borderRadius: 6,
            fontFamily: 'Inter',
          }}
        >
          <option value="live">Live</option>
          <option value="inscription">Inscrition</option>
          <option value="draft">Brouillon</option>
          <option value="registration">Inscriptions</option>
          <option value="demie-finale">Demi-finale</option>
          <option value="finale">Finale</option>
        </select>
        <button
          type="submit"
          style={{
            background: '#3e27a6',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            padding: '0 16',
            cursor: 'pointer',
            fontFamily: 'Inter',
          }}
        >
          Créer
        </button>
      </form>
    </div>
  );
};