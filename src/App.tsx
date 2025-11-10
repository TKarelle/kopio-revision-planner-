import { useState, useEffect } from "react";
import {
  format,
  startOfWeek,
  addDays,
  isSameDay,
  parseISO,
  addWeeks,
  subWeeks,
} from "date-fns";
import { fr } from "date-fns/locale/fr";
import "./App.css";

interface Chapter {
  id: string;
  name: string;
  completed: boolean;
  difficulty: "facile" | "moyen" | "difficile";
}

interface Subject {
  id: string;
  name: string;
  color: string;
  icon: string;
  chapters: Chapter[];
  type: "info" | "maths" | "physique" | "chimie" | "autre";
  totalHours: number;
  completedHours: number;
}

interface RevisionSlot {
  id: string;
  subjectId: string;
  chapterId?: string;
  date: Date;
  startTime: string;
  duration: number; // en minutes
  type: "cours" | "exercices" | "td" | "examen" | "revision";
  completed: boolean;
  priority: "basse" | "normale" | "haute";
  notes?: string;
}

const SUBJECT_TEMPLATES = {
  info: [
    { name: "Algorithmique", icon: "🔢", color: "#7c3aed" },
    { name: "Programmation", icon: "💻", color: "#059669" },
    { name: "Bases de données", icon: "🗄️", color: "#dc2626" },
    { name: "Réseaux", icon: "🌐", color: "#2563eb" },
    { name: "Systèmes d'exploitation", icon: "⚙️", color: "#ea580c" },
  ],
  maths: [
    { name: "Algèbre linéaire", icon: "📐", color: "#7c3aed" },
    { name: "Analyse", icon: "📊", color: "#059669" },
    { name: "Probabilités", icon: "🎲", color: "#dc2626" },
    { name: "Statistiques", icon: "📈", color: "#2563eb" },
    { name: "Géométrie", icon: "🔺", color: "#ea580c" },
  ],
  physique: [
    { name: "Mécanique", icon: "⚛️", color: "#7c3aed" },
    { name: "Électromagnétisme", icon: "⚡", color: "#059669" },
    { name: "Thermodynamique", icon: "🌡️", color: "#dc2626" },
    { name: "Optique", icon: "🔬", color: "#2563eb" },
    { name: "Quantique", icon: "⚛️", color: "#ea580c" },
  ],
  chimie: [
    { name: "Chimie organique", icon: "🧪", color: "#7c3aed" },
    { name: "Chimie inorganique", icon: "⚗️", color: "#059669" },
    { name: "Thermochimie", icon: "🔥", color: "#dc2626" },
    { name: "Cinétique", icon: "⏱️", color: "#2563eb" },
    { name: "Équilibres", icon: "⚖️", color: "#ea580c" },
  ],
};

function App() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [revisionSlots, setRevisionSlots] = useState<RevisionSlot[]>([]);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [viewMode, setViewMode] = useState<"week" | "month">("week");
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [showTemplates, setShowTemplates] = useState(true);
  const [newSubjectName, setNewSubjectName] = useState("");
  const [newSubjectType, setNewSubjectType] = useState<
    "info" | "maths" | "physique" | "chimie" | "autre"
  >("info");
  const [showSlotModal, setShowSlotModal] = useState(false);
  const [editingSlot, setEditingSlot] = useState<RevisionSlot | null>(null);

  // Charger les données depuis localStorage
  useEffect(() => {
    const savedSubjects = localStorage.getItem("subjects");
    const savedSlots = localStorage.getItem("revisionSlots");
    if (savedSubjects) {
      setSubjects(
        JSON.parse(savedSubjects).map((s: any) => ({
          ...s,
          chapters: s.chapters || [],
        }))
      );
    }
    if (savedSlots) {
      setRevisionSlots(
        JSON.parse(savedSlots).map((s: any) => ({
          ...s,
          date: new Date(s.date),
        }))
      );
    }
  }, []);

  // Sauvegarder dans localStorage
  useEffect(() => {
    localStorage.setItem("subjects", JSON.stringify(subjects));
  }, [subjects]);

  useEffect(() => {
    localStorage.setItem("revisionSlots", JSON.stringify(revisionSlots));
  }, [revisionSlots]);

  const addSubjectFromTemplate = (
    template: (typeof SUBJECT_TEMPLATES.info)[0],
    type: "info" | "maths" | "physique" | "chimie"
  ) => {
    const newSubject: Subject = {
      id: Date.now().toString(),
      name: template.name,
      color: template.color,
      icon: template.icon,
      type: type,
      chapters: [],
      totalHours: 0,
      completedHours: 0,
    };
    setSubjects([...subjects, newSubject]);
  };

  const addCustomSubject = () => {
    if (newSubjectName.trim()) {
      const colors = [
        "#7c3aed",
        "#059669",
        "#dc2626",
        "#ea580c",
        "#ca8a04",
        "#2563eb",
        "#db2777",
      ];
      const icons = ["📚", "📖", "📝", "📋", "📑", "📄", "📃"];
      const newSubject: Subject = {
        id: Date.now().toString(),
        name: newSubjectName.trim(),
        color: colors[subjects.length % colors.length],
        icon: icons[subjects.length % icons.length],
        type: newSubjectType,
        chapters: [],
        totalHours: 0,
        completedHours: 0,
      };
      setSubjects([...subjects, newSubject]);
      setNewSubjectName("");
      setShowAddSubject(false);
    }
  };

  const deleteSubject = (subjectId: string) => {
    if (
      window.confirm(
        "Êtes-vous sûr de vouloir supprimer cette matière ? Tous les créneaux associés seront également supprimés."
      )
    ) {
      // Supprimer la matière
      setSubjects(subjects.filter((s) => s.id !== subjectId));
      // Supprimer tous les créneaux associés
      setRevisionSlots(
        revisionSlots.filter((slot) => slot.subjectId !== subjectId)
      );
      // Si la matière était sélectionnée, désélectionner
      if (selectedSubject === subjectId) {
        setSelectedSubject(null);
      }
    }
  };

  const addChapter = (subjectId: string, chapterName: string) => {
    const newChapter: Chapter = {
      id: Date.now().toString(),
      name: chapterName,
      completed: false,
      difficulty: "moyen",
    };
    setSubjects(
      subjects.map((s) =>
        s.id === subjectId ? { ...s, chapters: [...s.chapters, newChapter] } : s
      )
    );
  };

  const toggleChapterCompleted = (subjectId: string, chapterId: string) => {
    setSubjects(
      subjects.map((s) =>
        s.id === subjectId
          ? {
              ...s,
              chapters: s.chapters.map((c) =>
                c.id === chapterId ? { ...c, completed: !c.completed } : c
              ),
            }
          : s
      )
    );
  };

  const deleteChapter = (subjectId: string, chapterId: string) => {
    setSubjects(
      subjects.map((s) =>
        s.id === subjectId
          ? {
              ...s,
              chapters: s.chapters.filter((c) => c.id !== chapterId),
            }
          : s
      )
    );
    // Supprimer aussi les créneaux associés à ce chapitre
    setRevisionSlots(
      revisionSlots.filter((slot) => slot.chapterId !== chapterId)
    );
  };

  const openSlotModal = (date?: Date, subjectId?: string) => {
    if (date && subjectId) {
      setEditingSlot({
        id: "",
        subjectId,
        date,
        startTime: "09:00",
        duration: 60,
        type: "revision",
        completed: false,
        priority: "normale",
      });
    } else {
      setEditingSlot(null);
    }
    setShowSlotModal(true);
  };

  const saveSlot = (slot: Omit<RevisionSlot, "id">) => {
    if (editingSlot?.id) {
      setRevisionSlots(
        revisionSlots.map((s) =>
          s.id === editingSlot.id ? { ...slot, id: editingSlot.id } : s
        )
      );
    } else {
      const newSlot: RevisionSlot = {
        ...slot,
        id: Date.now().toString(),
      };
      setRevisionSlots([...revisionSlots, newSlot]);
    }
    setShowSlotModal(false);
    setEditingSlot(null);
  };

  const deleteSlot = (slotId: string) => {
    setRevisionSlots(revisionSlots.filter((s) => s.id !== slotId));
  };

  const toggleSlotCompleted = (slotId: string) => {
    setRevisionSlots(
      revisionSlots.map((slot) => {
        if (slot.id === slotId) {
          const updated = { ...slot, completed: !slot.completed };
          // Mettre à jour les heures complétées
          if (updated.completed && !slot.completed) {
            setSubjects(
              subjects.map((s) =>
                s.id === slot.subjectId
                  ? {
                      ...s,
                      completedHours: s.completedHours + slot.duration / 60,
                    }
                  : s
              )
            );
          } else if (!updated.completed && slot.completed) {
            setSubjects(
              subjects.map((s) =>
                s.id === slot.subjectId
                  ? {
                      ...s,
                      completedHours: Math.max(
                        0,
                        s.completedHours - slot.duration / 60
                      ),
                    }
                  : s
              )
            );
          }
          return updated;
        }
        return slot;
      })
    );
  };

  const getWeekDays = () => {
    const start = startOfWeek(currentWeek, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  };

  const getDaySlots = (date: Date) => {
    return revisionSlots.filter((slot) => isSameDay(new Date(slot.date), date));
  };

  const getSubjectStats = (subjectId: string) => {
    const slots = revisionSlots.filter((slot) => slot.subjectId === subjectId);
    const completed = slots.filter((slot) => slot.completed).length;
    const totalMinutes = slots.reduce((sum, slot) => sum + slot.duration, 0);
    const completedMinutes = slots
      .filter((slot) => slot.completed)
      .reduce((sum, slot) => sum + slot.duration, 0);
    return {
      total: slots.length,
      completed,
      totalMinutes,
      completedMinutes,
      hours: Math.floor(totalMinutes / 60),
      completedHours: Math.floor(completedMinutes / 60),
      progress: totalMinutes > 0 ? (completedMinutes / totalMinutes) * 100 : 0,
    };
  };

  const getOverallStats = () => {
    const totalSlots = revisionSlots.length;
    const completedSlots = revisionSlots.filter((s) => s.completed).length;
    const totalHours =
      revisionSlots.reduce((sum, slot) => sum + slot.duration, 0) / 60;
    const completedHours =
      revisionSlots
        .filter((s) => s.completed)
        .reduce((sum, slot) => sum + slot.duration, 0) / 60;
    return {
      totalSlots,
      completedSlots,
      totalHours: Math.floor(totalHours),
      completedHours: Math.floor(completedHours),
      progress: totalSlots > 0 ? (completedSlots / totalSlots) * 100 : 0,
    };
  };

  const weekDays = getWeekDays();
  const stats = getOverallStats();

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <div>
            <h1>📅 Planificateur de révision KOPIO</h1>
            <p>Organise tes révisions pour réussir tes examens</p>
          </div>
          <div className="header-actions">
            <button
              className={`view-toggle ${viewMode === "week" ? "active" : ""}`}
              onClick={() => setViewMode("week")}
            >
              Semaine
            </button>
            <button
              className={`view-toggle ${viewMode === "month" ? "active" : ""}`}
              onClick={() => setViewMode("month")}
            >
              Mois
            </button>
          </div>
        </div>
      </header>

      <main className="main">
        {/* Statistiques globales */}
        <section className="stats-section">
          <div className="stat-card primary">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <div className="stat-value">
                {stats.completedSlots}/{stats.totalSlots}
              </div>
              <div className="stat-label">Séances complétées</div>
              <div className="stat-progress">
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${stats.progress}%` }}
                  ></div>
                </div>
                <span>{Math.round(stats.progress)}%</span>
              </div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">⏱️</div>
            <div className="stat-content">
              <div className="stat-value">{stats.completedHours}h</div>
              <div className="stat-label">Heures révisées</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📚</div>
            <div className="stat-content">
              <div className="stat-value">{subjects.length}</div>
              <div className="stat-label">Matières</div>
            </div>
          </div>
        </section>

        {/* Section Matières */}
        <section className="section">
          <div className="section-header">
            <h2>📚 Mes matières</h2>
            <button
              className="btn-primary"
              onClick={() => setShowAddSubject(!showAddSubject)}
            >
              + Ajouter une matière
            </button>
          </div>

          {showAddSubject && (
            <div className="add-subject-form">
              <div className="form-group">
                <label>Nom de la matière</label>
                <input
                  type="text"
                  placeholder="Ex: Algorithmique avancée"
                  value={newSubjectName}
                  onChange={(e) => setNewSubjectName(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Type</label>
                <select
                  value={newSubjectType}
                  onChange={(e) => setNewSubjectType(e.target.value as any)}
                >
                  <option value="info">Informatique</option>
                  <option value="maths">Mathématiques</option>
                  <option value="physique">Physique</option>
                  <option value="chimie">Chimie</option>
                  <option value="autre">Autre</option>
                </select>
              </div>
              <div className="form-actions">
                <button
                  className="btn-secondary"
                  onClick={() => setShowAddSubject(false)}
                >
                  Annuler
                </button>
                <button className="btn-primary" onClick={addCustomSubject}>
                  Ajouter
                </button>
              </div>
            </div>
          )}

          {/* Templates de matières */}
          <div className="templates-section">
            <div className="templates-header">
              <h3>Ajouter des matières depuis les templates</h3>
              {subjects.length > 0 && (
                <button
                  className="btn-secondary"
                  onClick={() => setShowTemplates(!showTemplates)}
                >
                  {showTemplates ? "Masquer" : "Afficher"} les templates
                </button>
              )}
            </div>
            {showTemplates && (
              <div className="templates-grid">
                <div className="template-category">
                  <h4>💻 Informatique</h4>
                  <div className="template-buttons">
                    {SUBJECT_TEMPLATES.info.map((template) => (
                      <button
                        key={template.name}
                        className="template-btn"
                        style={{ borderColor: template.color }}
                        onClick={() => addSubjectFromTemplate(template, "info")}
                      >
                        {template.icon} {template.name}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="template-category">
                  <h4>📐 Mathématiques</h4>
                  <div className="template-buttons">
                    {SUBJECT_TEMPLATES.maths.map((template) => (
                      <button
                        key={template.name}
                        className="template-btn"
                        style={{ borderColor: template.color }}
                        onClick={() =>
                          addSubjectFromTemplate(template, "maths")
                        }
                      >
                        {template.icon} {template.name}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="template-category">
                  <h4>⚛️ Physique</h4>
                  <div className="template-buttons">
                    {SUBJECT_TEMPLATES.physique.map((template) => (
                      <button
                        key={template.name}
                        className="template-btn"
                        style={{ borderColor: template.color }}
                        onClick={() =>
                          addSubjectFromTemplate(template, "physique")
                        }
                      >
                        {template.icon} {template.name}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="template-category">
                  <h4>🧪 Chimie</h4>
                  <div className="template-buttons">
                    {SUBJECT_TEMPLATES.chimie.map((template) => (
                      <button
                        key={template.name}
                        className="template-btn"
                        style={{ borderColor: template.color }}
                        onClick={() =>
                          addSubjectFromTemplate(template, "chimie")
                        }
                      >
                        {template.icon} {template.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="subjects-grid">
            {subjects.map((subject) => {
              const subjectStats = getSubjectStats(subject.id);
              return (
                <div
                  key={subject.id}
                  className="subject-card"
                  style={{ borderLeftColor: subject.color }}
                >
                  <div className="subject-header">
                    <div className="subject-title">
                      <span className="subject-icon">{subject.icon}</span>
                      <h3>{subject.name}</h3>
                    </div>
                    <div className="subject-actions">
                      <button
                        className="btn-icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSubject(
                            selectedSubject === subject.id ? null : subject.id
                          );
                        }}
                        title={
                          selectedSubject === subject.id
                            ? "Réduire"
                            : "Développer"
                        }
                      >
                        {selectedSubject === subject.id ? "▼" : "▶"}
                      </button>
                      <button
                        className="btn-icon btn-delete"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteSubject(subject.id);
                        }}
                        title="Supprimer la matière"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                  <div className="subject-stats">
                    <div className="stat-item">
                      <span className="stat-number">
                        {subjectStats.completed}/{subjectStats.total}
                      </span>
                      <span className="stat-text">séances</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-number">
                        {subjectStats.completedHours}h
                      </span>
                      <span className="stat-text">révisées</span>
                    </div>
                    <div className="progress-circle">
                      <svg width="50" height="50">
                        <circle
                          cx="25"
                          cy="25"
                          r="20"
                          fill="none"
                          stroke="#e5e7eb"
                          strokeWidth="4"
                        />
                        <circle
                          cx="25"
                          cy="25"
                          r="20"
                          fill="none"
                          stroke={subject.color}
                          strokeWidth="4"
                          strokeDasharray={`${2 * Math.PI * 20}`}
                          strokeDashoffset={`${
                            2 * Math.PI * 20 * (1 - subjectStats.progress / 100)
                          }`}
                          transform="rotate(-90 25 25)"
                        />
                      </svg>
                      <span className="progress-text">
                        {Math.round(subjectStats.progress)}%
                      </span>
                    </div>
                  </div>

                  {selectedSubject === subject.id && (
                    <div className="subject-details">
                      <div className="chapters-section">
                        <h4>Chapitres</h4>
                        <div className="chapters-list">
                          {subject.chapters.map((chapter) => (
                            <div
                              key={chapter.id}
                              className={`chapter-item ${
                                chapter.completed ? "completed" : ""
                              }`}
                            >
                              <div
                                className="chapter-content"
                                onClick={() =>
                                  toggleChapterCompleted(subject.id, chapter.id)
                                }
                              >
                                <input
                                  type="checkbox"
                                  checked={chapter.completed}
                                  onChange={() => {}}
                                />
                                <span>{chapter.name}</span>
                                <span
                                  className={`difficulty-badge ${chapter.difficulty}`}
                                >
                                  {chapter.difficulty}
                                </span>
                              </div>
                              <button
                                className="btn-icon-small btn-delete"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (
                                    window.confirm(
                                      `Supprimer le chapitre "${chapter.name}" ?`
                                    )
                                  ) {
                                    deleteChapter(subject.id, chapter.id);
                                  }
                                }}
                                title="Supprimer le chapitre"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                          <input
                            type="text"
                            className="add-chapter-input"
                            placeholder="+ Ajouter un chapitre"
                            onKeyDown={(e) => {
                              if (
                                e.key === "Enter" &&
                                e.currentTarget.value.trim()
                              ) {
                                addChapter(
                                  subject.id,
                                  e.currentTarget.value.trim()
                                );
                                e.currentTarget.value = "";
                              }
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Section Planning */}
        <section className="section">
          <div className="section-header">
            <h2>📅 Planning</h2>
            <div className="week-navigation">
              <button
                className="btn-icon"
                onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}
              >
                ←
              </button>
              <span className="week-display">
                {format(weekDays[0], "d MMM", { locale: fr })} -{" "}
                {format(weekDays[6], "d MMM yyyy", { locale: fr })}
              </span>
              <button
                className="btn-icon"
                onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
              >
                →
              </button>
              <button
                className="btn-secondary"
                onClick={() => setCurrentWeek(new Date())}
              >
                Aujourd'hui
              </button>
            </div>
          </div>

          <div className="planning-grid">
            {weekDays.map((day, index) => {
              const daySlots = getDaySlots(day);
              const isToday = isSameDay(day, new Date());
              return (
                <div
                  key={index}
                  className={`day-column ${isToday ? "today" : ""}`}
                >
                  <div className="day-header">
                    <h3>{format(day, "EEE", { locale: fr })}</h3>
                    <span className="day-number">{format(day, "d")}</span>
                  </div>
                  <div className="day-slots">
                    {daySlots
                      .sort((a, b) => a.startTime.localeCompare(b.startTime))
                      .map((slot) => {
                        const subject = subjects.find(
                          (s) => s.id === slot.subjectId
                        );
                        const chapter = subject?.chapters.find(
                          (c) => c.id === slot.chapterId
                        );
                        return (
                          <div
                            key={slot.id}
                            className={`revision-slot ${
                              slot.completed ? "completed" : ""
                            } priority-${slot.priority}`}
                            style={{ borderLeftColor: subject?.color }}
                            onClick={() => toggleSlotCompleted(slot.id)}
                          >
                            <div className="slot-header">
                              <div className="slot-subject-info">
                                <span className="slot-subject">
                                  {subject?.icon} {subject?.name}
                                </span>
                                {chapter && (
                                  <span className="slot-chapter">
                                    📑 {chapter.name}
                                  </span>
                                )}
                              </div>
                              <button
                                className="btn-icon-small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteSlot(slot.id);
                                }}
                              >
                                ×
                              </button>
                            </div>
                            <div className="slot-time">
                              {slot.startTime} -{" "}
                              {Math.floor(slot.duration / 60)}h
                              {slot.duration % 60 > 0
                                ? `${slot.duration % 60}`
                                : ""}
                            </div>
                            <div className="slot-type">{slot.type}</div>
                          </div>
                        );
                      })}
                    <button
                      className="add-slot-btn"
                      onClick={() => openSlotModal(day)}
                    >
                      + Ajouter
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {/* Modal pour ajouter/modifier un créneau */}
      {showSlotModal && (
        <SlotModal
          slot={editingSlot}
          subjects={subjects}
          onSave={saveSlot}
          onClose={() => {
            setShowSlotModal(false);
            setEditingSlot(null);
          }}
        />
      )}

      <footer className="footer">
        <p>
          Développé par <a href="https://www.kopio.eu">KOPIO</a> - Outil
          open-source gratuit
        </p>
        <p>
          <a href="https://github.com/TKarelle/kopio-revision-planner-">
            ⭐ Donner une étoile sur GitHub
          </a>
        </p>
      </footer>
    </div>
  );
}

// Composant Modal pour les créneaux
function SlotModal({
  slot,
  subjects,
  onSave,
  onClose,
}: {
  slot: RevisionSlot | null;
  subjects: Subject[];
  onSave: (slot: Omit<RevisionSlot, "id">) => void;
  onClose: () => void;
}) {
  const [subjectId, setSubjectId] = useState(
    slot?.subjectId || subjects[0]?.id || ""
  );
  const [chapterId, setChapterId] = useState(slot?.chapterId || "");

  // Mettre à jour le chapitre quand le slot change
  useEffect(() => {
    if (slot?.chapterId) {
      setChapterId(slot.chapterId);
    } else {
      setChapterId("");
    }
  }, [slot?.chapterId]);
  const [date, setDate] = useState(
    slot?.date
      ? format(slot.date, "yyyy-MM-dd")
      : format(new Date(), "yyyy-MM-dd")
  );
  const [startTime, setStartTime] = useState(slot?.startTime || "09:00");
  const [duration, setDuration] = useState(slot?.duration || 60);
  const [type, setType] = useState<RevisionSlot["type"]>(
    slot?.type || "revision"
  );
  const [priority, setPriority] = useState<RevisionSlot["priority"]>(
    slot?.priority || "normale"
  );
  const [notes, setNotes] = useState(slot?.notes || "");

  const selectedSubject = subjects.find((s) => s.id === subjectId);
  const availableChapters = selectedSubject?.chapters || [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      subjectId,
      chapterId: chapterId || undefined,
      date: parseISO(date),
      startTime,
      duration,
      type,
      priority,
      completed: slot?.completed || false,
      notes: notes.trim() || undefined,
    });
  };

  // Réinitialiser le chapitre si la matière change
  const handleSubjectChange = (newSubjectId: string) => {
    setSubjectId(newSubjectId);
    setChapterId(""); // Réinitialiser le chapitre quand on change de matière
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{slot?.id ? "Modifier" : "Ajouter"} un créneau de révision</h3>
          <button className="btn-icon" onClick={onClose}>
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Matière</label>
            <select
              value={subjectId}
              onChange={(e) => handleSubjectChange(e.target.value)}
              required
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.icon} {s.name}
                </option>
              ))}
            </select>
          </div>
          {availableChapters.length > 0 && (
            <div className="form-group">
              <label>Chapitre (optionnel)</label>
              <select
                value={chapterId}
                onChange={(e) => setChapterId(e.target.value)}
              >
                <option value="">Aucun chapitre spécifique</option>
                {availableChapters.map((chapter) => (
                  <option key={chapter.id} value={chapter.id}>
                    {chapter.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="form-row">
            <div className="form-group">
              <label>Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Heure de début</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Durée (min)</label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value) || 60)}
                min="15"
                step="15"
                required
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
              >
                <option value="cours">📖 Cours</option>
                <option value="exercices">✏️ Exercices</option>
                <option value="td">📝 TD</option>
                <option value="examen">📋 Examen</option>
                <option value="revision">🔄 Révision</option>
              </select>
            </div>
            <div className="form-group">
              <label>Priorité</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
              >
                <option value="basse">🟢 Basse</option>
                <option value="normale">🟡 Normale</option>
                <option value="haute">🔴 Haute</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Notes (optionnel)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Ex: Réviser les algorithmes de tri..."
            />
          </div>
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Annuler
            </button>
            <button type="submit" className="btn-primary">
              {slot?.id ? "Modifier" : "Ajouter"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default App;
