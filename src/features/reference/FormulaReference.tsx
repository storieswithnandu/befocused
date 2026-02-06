import React, { useState } from 'react';
import { Search, ChevronDown, ChevronRight, Calculator, Sigma } from 'lucide-react';

interface FormulaCategory {
    title: string;
    items: {
        name: string;
        formula: string;
        description: string;
    }[];
}

const CONSTANTS = [
    { symbol: 'ℏ', value: '1.054 × 10⁻³⁴ J⋅s', name: 'Reduced Planck Constant' },
    { symbol: 'k_B', value: '1.380 × 10⁻²³ J/K', name: 'Boltzmann Constant' },
    { symbol: 'G', value: '6.674 × 10⁻¹¹ m³⋅kg⁻¹⋅s⁻²', name: 'Gravitational Constant' },
    { symbol: 'c', value: '2.998 × 10⁸ m/s', name: 'Speed of Light' },
    { symbol: 'ε₀', value: '8.854 × 10⁻¹² F/m', name: 'Vacuum Permittivity' },
    { symbol: 'μ₀', value: '1.257 × 10⁻⁶ H/m', name: 'Vacuum Permeability' },
    { symbol: 'm_e', value: '9.109 × 10⁻³¹ kg', name: 'Electron Mass' },
    { symbol: 'm_p', value: '1.672 × 10⁻²⁷ kg', name: 'Proton Mass' },
];

const FORMULAS: FormulaCategory[] = [
    {
        title: 'Quantum Mechanics',
        items: [
            { name: 'Schrödinger Equation (Time-Dependent)', formula: 'iℏ ∂ψ/∂t = Ĥψ', description: 'Fundamental equation of motion for quantum states.' },
            { name: 'Heisenberg Uncertainty', formula: 'σ_x σ_p ≥ ℏ/2', description: 'Fundamental limit to the precision of complementary variables.' },
            { name: 'Energy Expectation', formula: '⟨E⟩ = ⟨ψ|Ĥ|ψ⟩', description: 'Average energy of the system.' }
        ]
    },
    {
        title: 'Statistical Mechanics',
        items: [
            { name: 'Partition Function (Canonical)', formula: 'Z = Σ exp(-βE_i)', description: 'Sum over states.' },
            { name: 'Entropy (Boltzmann)', formula: 'S = k_B ln(Ω)', description: 'Relation between entropy and microstates.' },
            { name: 'Free Energy (Helmholtz)', formula: 'F = -k_B T ln(Z)', description: 'Thermodynamic potential.' }
        ]
    },
    {
        title: 'Electrodynamics',
        items: [
            { name: 'Maxwell - Gauss (E)', formula: '∇ ⋅ E = ρ/ε₀', description: 'Electric flux.' },
            { name: 'Maxwell - Gauss (B)', formula: '∇ ⋅ B = 0', description: 'No magnetic monopoles.' },
            { name: 'Maxwell - Faraday', formula: '∇ × E = -∂B/∂t', description: 'Induction.' },
            { name: 'Maxwell - Ampere', formula: '∇ × B = μ₀J + μ₀ε₀ ∂E/∂t', description: 'Displacement current.' }
        ]
    }
];

export const FormulaReference: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
        'Constants': true,
        'Quantum Mechanics': true
    });

    const toggleSection = (title: string) => {
        setExpandedSections(prev => ({
            ...prev,
            [title]: !prev[title]
        }));
    };

    const filteredFormulas = FORMULAS.map(cat => ({
        ...cat,
        items: cat.items.filter(item =>
            item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.formula.toLowerCase().includes(searchTerm.toLowerCase())
        )
    })).filter(cat => cat.items.length > 0 || cat.title.toLowerCase().includes(searchTerm.toLowerCase()));

    const filteredConstants = CONSTANTS.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.symbol.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="reference-container">
            <div className="reference-header">
                <div>
                    <h1>Physics Reference</h1>
                    <p className="subtitle">Constants, Formulas, and Quick Access.</p>
                </div>
                <div className="search-bar">
                    <Search size={18} />
                    <input
                        placeholder="Search formulas or constants..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="reference-grid">
                <div className="section-card">
                    <div
                        className="section-header-row"
                        onClick={() => toggleSection('Constants')}
                    >
                        <h3><Calculator size={18} /> Universal Constants</h3>
                        {expandedSections['Constants'] ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                    </div>

                    {expandedSections['Constants'] && (
                        <div className="constants-grid">
                            {filteredConstants.map((c, i) => (
                                <div key={i} className="constant-item">
                                    <div className="const-symbol">{c.symbol}</div>
                                    <div className="const-val">{c.value}</div>
                                    <div className="const-name">{c.name}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {filteredFormulas.map((category) => (
                    <div key={category.title} className="section-card">
                        <div
                            className="section-header-row"
                            onClick={() => toggleSection(category.title)}
                        >
                            <h3><Sigma size={18} /> {category.title}</h3>
                            {expandedSections[category.title] ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                        </div>
                        {expandedSections[category.title] && (
                            <div className="formulas-list">
                                {category.items.map((item, idx) => (
                                    <div key={idx} className="formula-item">
                                        <div className="formula-math">{item.formula}</div>
                                        <div className="formula-info">
                                            <span className="formula-name">{item.name}</span>
                                            <span className="formula-desc">{item.description}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <style>{`
                .reference-container {
                    display: flex;
                    flex-direction: column;
                    gap: 2rem;
                }
                
                .reference-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-end;
                    flex-wrap: wrap;
                    gap: 1rem;
                }

                .search-bar {
                    display: flex;
                    align-items: center;
                    background: var(--color-bg-card);
                    border: 1px solid var(--color-border);
                    border-radius: var(--radius-md);
                    padding: 0.5rem 1rem;
                    width: 300px;
                    gap: 0.5rem;
                    color: var(--color-text-secondary);
                }
                
                .search-bar input {
                    background: transparent;
                    border: none;
                    outline: none;
                    color: var(--color-text-primary);
                    width: 100%;
                }

                .reference-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
                    gap: 1.5rem;
                }

                .section-card {
                    background: var(--color-bg-card);
                    border: 1px solid var(--color-border);
                    border-radius: var(--radius-lg);
                    overflow: hidden;
                    height: fit-content;
                    transition: all 0.2s ease;
                }
                
                .section-header-row {
                    padding: 1rem;
                    background: rgba(255, 255, 255, 0.03);
                    border-bottom: 1px solid var(--color-border);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    cursor: pointer;
                    user-select: none;
                }
                
                .section-header-row h3 {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-size: 1rem;
                    margin: 0;
                }

                /* Constants Grid */
                .constants-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 1px;
                    background: var(--color-border);
                }
                
                .constant-item {
                    background: var(--color-bg-card);
                    padding: 0.75rem;
                    display: flex;
                    flex-direction: column;
                    gap: 0.25rem;
                }
                
                .const-symbol {
                    font-family: 'Times New Roman', serif;
                    font-style: italic;
                    font-weight: bold;
                    color: var(--color-primary);
                    font-size: 1.2rem;
                }

                .const-val {
                    font-family: monospace;
                    font-size: 0.9rem;
                }
                
                .const-name {
                    font-size: 0.75rem;
                    color: var(--color-text-secondary);
                }

                /* Formulas List */
                .formulas-list {
                    display: flex;
                    flex-direction: column;
                }
                
                .formula-item {
                    padding: 1rem;
                    border-bottom: 1px solid var(--color-border);
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }
                
                .formula-item:last-child {
                    border-bottom: none;
                }

                .formula-math {
                    font-family: 'Times New Roman', serif;
                    font-size: 1.2rem;
                    font-weight: bold;
                    color: var(--color-text-primary);
                    min-width: 120px;
                    text-align: center;
                    background: rgba(0,0,0,0.1);
                    padding: 0.5rem;
                    border-radius: var(--radius-sm);
                }

                .formula-info {
                    display: flex;
                    flex-direction: column;
                }

                .formula-name {
                    font-weight: 600;
                    font-size: 0.9rem;
                }
                .formula-desc {
                    font-size: 0.8rem;
                    color: var(--color-text-secondary);
                }
                
                .subtitle {
                    color: var(--color-text-secondary);
                }

                @media (max-width: 768px) {
                    .reference-grid { grid-template-columns: 1fr; }
                    .search-bar { width: 100%; }
                }
            `}</style>
        </div>
    );
};
