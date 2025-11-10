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
    <div className="min-h-screen bg-background-secondary">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="container-max py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                📅 Planificateur de révision KOPIO
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Organise tes révisions pour réussir tes examens
              </p>
            </div>
            <div className="flex gap-2">
              <button
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                  viewMode === "week"
                    ? "bg-brand-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
                onClick={() => setViewMode("week")}
              >
                Semaine
              </button>
              <button
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                  viewMode === "month"
                    ? "bg-brand-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
                onClick={() => setViewMode("month")}
              >
                Mois
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container-max py-6 space-y-6">
        {/* Statistiques globales */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-brand-600 to-brand-700 text-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center gap-4">
              <div className="text-4xl">📊</div>
              <div className="flex-1">
                <div className="text-3xl font-bold mb-1">
                  {stats.completedSlots}/{stats.totalSlots}
                </div>
                <div className="text-sm opacity-90 mb-3">Séances complétées</div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-white/30 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-white rounded-full transition-all"
                      style={{ width: `${stats.progress}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-semibold">{Math.round(stats.progress)}%</span>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="text-4xl">⏱️</div>
              <div>
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {stats.completedHours}h
                </div>
                <div className="text-sm text-gray-600">Heures révisées</div>
              </div>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="text-4xl">📚</div>
              <div>
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {subjects.length}
                </div>
                <div className="text-sm text-gray-600">Matières</div>
              </div>
            </div>
          </div>
        </section>

        {/* Section Matières */}
        <section className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">📚 Mes matières</h2>
            <button
              className="btn-primary"
              onClick={() => setShowAddSubject(!showAddSubject)}
            >
              + Ajouter une matière
            </button>
          </div>

          {showAddSubject && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Nom de la matière
                </label>
                <input
                  type="text"
                  placeholder="Ex: Algorithmique avancée"
                  value={newSubjectName}
                  onChange={(e) => setNewSubjectName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Type</label>
                <select
                  value={newSubjectType}
                  onChange={(e) => setNewSubjectType(e.target.value as any)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent"
                >
                  <option value="info">Informatique</option>
                  <option value="maths">Mathématiques</option>
                  <option value="physique">Physique</option>
                  <option value="chimie">Chimie</option>
                  <option value="autre">Autre</option>
                </select>
              </div>
              <div className="flex gap-3 justify-end">
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
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-900">
                Ajouter des matières depuis les templates
              </h3>
              {subjects.length > 0 && (
                <button
                  className="btn-ghost text-sm"
                  onClick={() => setShowTemplates(!showTemplates)}
                >
                  {showTemplates ? "Masquer" : "Afficher"} les templates
                </button>
              )}
            </div>
            {showTemplates && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">💻 Informatique</h4>
                  <div className="flex flex-wrap gap-2">
                    {SUBJECT_TEMPLATES.info.map((template) => (
                      <button
                        key={template.name}
                        className="px-4 py-2 bg-white border-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                        style={{ borderColor: template.color }}
                        onClick={() => addSubjectFromTemplate(template, "info")}
                      >
                        {template.icon} {template.name}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">📐 Mathématiques</h4>
                  <div className="flex flex-wrap gap-2">
                    {SUBJECT_TEMPLATES.maths.map((template) => (
                      <button
                        key={template.name}
                        className="px-4 py-2 bg-white border-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                        style={{ borderColor: template.color }}
                        onClick={() => addSubjectFromTemplate(template, "maths")}
                      >
                        {template.icon} {template.name}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">⚛️ Physique</h4>
                  <div className="flex flex-wrap gap-2">
                    {SUBJECT_TEMPLATES.physique.map((template) => (
                      <button
                        key={template.name}
                        className="px-4 py-2 bg-white border-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                        style={{ borderColor: template.color }}
                        onClick={() => addSubjectFromTemplate(template, "physique")}
                      >
                        {template.icon} {template.name}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">🧪 Chimie</h4>
                  <div className="flex flex-wrap gap-2">
                    {SUBJECT_TEMPLATES.chimie.map((template) => (
                      <button
                        key={template.name}
                        className="px-4 py-2 bg-white border-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                        style={{ borderColor: template.color }}
                        onClick={() => addSubjectFromTemplate(template, "chimie")}
                      >
                        {template.icon} {template.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subjects.map((subject) => {
              const subjectStats = getSubjectStats(subject.id);
              return (
                <div
                  key={subject.id}
                  className="bg-white border-l-4 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
                  style={{ borderLeftColor: subject.color }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{subject.icon}</span>
                      <h3 className="text-base font-semibold text-gray-900">{subject.name}</h3>
                    </div>
                    <div className="flex gap-1">
                      <button
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSubject(
                            selectedSubject === subject.id ? null : subject.id
                          );
                        }}
                        title={selectedSubject === subject.id ? "Réduire" : "Développer"}
                      >
                        {selectedSubject === subject.id ? "▼" : "▶"}
                      </button>
                      <button
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-gray-600 hover:text-red-600 transition-colors"
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
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="text-sm text-gray-600">
                        <span className="font-semibold text-gray-900">
                          {subjectStats.completed}/{subjectStats.total}
                        </span>{" "}
                        séances
                      </div>
                      <div className="text-sm text-gray-600">
                        <span className="font-semibold text-gray-900">
                          {subjectStats.completedHours}h
                        </span>{" "}
                        révisées
                      </div>
                    </div>
                    <div className="relative w-12 h-12">
                      <svg className="transform -rotate-90" width="48" height="48">
                        <circle
                          cx="24"
                          cy="24"
                          r="20"
                          fill="none"
                          stroke="#e5e7eb"
                          strokeWidth="4"
                        />
                        <circle
                          cx="24"
                          cy="24"
                          r="20"
                          fill="none"
                          stroke={subject.color}
                          strokeWidth="4"
                          strokeDasharray={`${2 * Math.PI * 20}`}
                          strokeDashoffset={`${
                            2 * Math.PI * 20 * (1 - subjectStats.progress / 100)
                          }`}
                        />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-gray-900">
                        {Math.round(subjectStats.progress)}%
                      </span>
                    </div>
                  </div>

                  {selectedSubject === subject.id && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <h4 className="text-sm font-semibold text-gray-900 mb-3">Chapitres</h4>
                      <div className="space-y-2">
                        {subject.chapters.map((chapter) => (
                          <div
                            key={chapter.id}
                            className={`flex items-center justify-between p-2 rounded-lg ${
                              chapter.completed
                                ? "bg-gray-50 opacity-60"
                                : "bg-white hover:bg-gray-50"
                            }`}
                          >
                            <div
                              className="flex items-center gap-2 flex-1 cursor-pointer"
                              onClick={() =>
                                toggleChapterCompleted(subject.id, chapter.id)
                              }
                            >
                              <input
                                type="checkbox"
                                checked={chapter.completed}
                                onChange={() => {}}
                                className="w-4 h-4 text-brand-600 rounded focus:ring-brand-600"
                              />
                              <span className={`text-sm ${chapter.completed ? "line-through text-gray-500" : "text-gray-900"}`}>
                                {chapter.name}
                              </span>
                              <span
                                className={`text-xs px-2 py-0.5 rounded-full ${
                                  chapter.difficulty === "facile"
                                    ? "bg-green-100 text-green-700"
                                    : chapter.difficulty === "moyen"
                                    ? "bg-yellow-100 text-yellow-700"
                                    : "bg-red-100 text-red-700"
                                }`}
                              >
                                {chapter.difficulty}
                              </span>
                            </div>
                            <button
                              className="w-6 h-6 flex items-center justify-center rounded hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
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
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent"
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
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Section Planning */}
        <section className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <h2 className="text-xl font-semibold text-gray-900">📅 Planning</h2>
            <div className="flex items-center gap-3">
              <button
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-300 hover:bg-gray-50 text-gray-700 transition-colors"
                onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}
                aria-label="Semaine précédente"
              >
                ←
              </button>
              <span className="text-sm font-medium text-gray-700 min-w-[200px] text-center">
                {format(weekDays[0], "d MMM", { locale: fr })} -{" "}
                {format(weekDays[6], "d MMM yyyy", { locale: fr })}
              </span>
              <button
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-300 hover:bg-gray-50 text-gray-700 transition-colors"
                onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
                aria-label="Semaine suivante"
              >
                →
              </button>
              <button
                className="btn-secondary text-sm"
                onClick={() => setCurrentWeek(new Date())}
              >
                Aujourd'hui
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
            {weekDays.map((day, index) => {
              const daySlots = getDaySlots(day);
              const isToday = isSameDay(day, new Date());
              return (
                <div
                  key={index}
                  className={`bg-gray-50 rounded-lg p-3 min-h-[200px] ${
                    isToday ? "ring-2 ring-brand-600 bg-brand-50" : ""
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-900">
                      {format(day, "EEE", { locale: fr })}
                    </h3>
                    <span className={`text-sm font-bold ${
                      isToday ? "text-brand-600" : "text-gray-600"
                    }`}>
                      {format(day, "d")}
                    </span>
                  </div>
                  <div className="space-y-2">
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
                            className={`bg-white border-l-4 rounded-lg p-2 cursor-pointer hover:shadow-sm transition-all ${
                              slot.completed ? "opacity-60" : ""
                            }`}
                            style={{ borderLeftColor: subject?.color }}
                            onClick={() => toggleSlotCompleted(slot.id)}
                          >
                            <div className="flex items-start justify-between mb-1">
                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-semibold text-gray-900 truncate">
                                  {subject?.icon} {subject?.name}
                                </div>
                                {chapter && (
                                  <div className="text-xs text-gray-600 truncate">
                                    📑 {chapter.name}
                                  </div>
                                )}
                              </div>
                              <button
                                className="w-5 h-5 flex items-center justify-center rounded hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors flex-shrink-0 ml-1"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteSlot(slot.id);
                                }}
                                aria-label="Supprimer le créneau"
                              >
                                ×
                              </button>
                            </div>
                            <div className="text-xs text-gray-600">
                              {slot.startTime} - {Math.floor(slot.duration / 60)}h
                              {slot.duration % 60 > 0 ? `${slot.duration % 60}` : ""}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">{slot.type}</div>
                          </div>
                        );
                      })}
                    <button
                      className="w-full py-2 text-xs font-medium text-brand-600 hover:text-brand-700 hover:bg-brand-50 rounded-lg transition-colors border border-dashed border-gray-300 hover:border-brand-300"
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

      <footer className="container-max py-8 text-center border-t border-gray-200 mt-12">
        <p className="text-sm text-gray-600 mb-2">
          Développé par{" "}
          <a
            href="https://www.kopio.eu"
            className="text-brand-600 hover:text-brand-700 font-medium"
          >
            KOPIO
          </a>{" "}
          - Outil open-source gratuit
        </p>
        <p className="text-sm text-gray-600">
          <a
            href="https://github.com/TKarelle/kopio-revision-planner-"
            className="text-brand-600 hover:text-brand-700 font-medium"
          >
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
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900">
            {slot?.id ? "Modifier" : "Ajouter"} un créneau de révision
          </h3>
          <button
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors"
            onClick={onClose}
            aria-label="Fermer"
          >
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Matière
            </label>
            <select
              value={subjectId}
              onChange={(e) => handleSubjectChange(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent"
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.icon} {s.name}
                </option>
              ))}
            </select>
          </div>
          {availableChapters.length > 0 && (
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Chapitre (optionnel)
              </label>
              <select
                value={chapterId}
                onChange={(e) => setChapterId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent"
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
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Heure
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Durée (min)
              </label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value) || 60)}
                min="15"
                step="15"
                required
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent"
              >
                <option value="cours">📖 Cours</option>
                <option value="exercices">✏️ Exercices</option>
                <option value="td">📝 TD</option>
                <option value="examen">📋 Examen</option>
                <option value="revision">🔄 Révision</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Priorité
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent"
              >
                <option value="basse">🟢 Basse</option>
                <option value="normale">🟡 Normale</option>
                <option value="haute">🔴 Haute</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Notes (optionnel)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Ex: Réviser les algorithmes de tri..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent resize-none"
            />
          </div>
          <div className="flex gap-3 justify-end pt-4">
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
