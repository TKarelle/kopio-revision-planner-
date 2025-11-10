import { useState } from "react";
import "./App.css";

interface Subject {
  id: string;
  name: string;
  color: string;
}

interface RevisionSlot {
  id: string;
  subjectId: string;
  date: Date;
  duration: number; // en minutes
  completed: boolean;
}

function App() {
  const [subjects, setSubjects] = useState<Subject[]>([
    { id: "1", name: "Algorithmique", color: "#7c3aed" },
    { id: "2", name: "Programmation", color: "#059669" },
  ]);
  const [revisionSlots, setRevisionSlots] = useState<RevisionSlot[]>([]);
  const [newSubjectName, setNewSubjectName] = useState("");

  const addSubject = () => {
    if (newSubjectName.trim()) {
      const colors = [
        "#7c3aed",
        "#059669",
        "#dc2626",
        "#ea580c",
        "#ca8a04",
        "#2563eb",
      ];
      const newSubject: Subject = {
        id: Date.now().toString(),
        name: newSubjectName.trim(),
        color: colors[subjects.length % colors.length],
      };
      setSubjects([...subjects, newSubject]);
      setNewSubjectName("");
    }
  };

  const addRevisionSlot = (subjectId: string, date: Date, duration: number) => {
    const newSlot: RevisionSlot = {
      id: Date.now().toString(),
      subjectId,
      date,
      duration,
      completed: false,
    };
    setRevisionSlots([...revisionSlots, newSlot]);
  };

  const toggleSlotCompleted = (slotId: string) => {
    setRevisionSlots(
      revisionSlots.map((slot) =>
        slot.id === slotId ? { ...slot, completed: !slot.completed } : slot
      )
    );
  };

  const getSubjectStats = (subjectId: string) => {
    const slots = revisionSlots.filter((slot) => slot.subjectId === subjectId);
    const completed = slots.filter((slot) => slot.completed).length;
    const totalMinutes = slots.reduce((sum, slot) => sum + slot.duration, 0);
    return {
      total: slots.length,
      completed,
      totalMinutes,
      hours: Math.floor(totalMinutes / 60),
      remainingMinutes: totalMinutes % 60,
    };
  };

  return (
    <div className="app">
      <header className="header">
        <h1>📅 Planificateur de révision KOPIO</h1>
        <p>Organise tes révisions efficacement</p>
      </header>

      <main className="main">
        {/* Section Matières */}
        <section className="section">
          <h2>📚 Mes matières</h2>
          <div className="subjects-list">
            {subjects.map((subject) => {
              const stats = getSubjectStats(subject.id);
              return (
                <div
                  key={subject.id}
                  className="subject-card"
                  style={{ borderColor: subject.color }}
                >
                  <div className="subject-header">
                    <h3>{subject.name}</h3>
                    <div
                      className="subject-color"
                      style={{ backgroundColor: subject.color }}
                    ></div>
                  </div>
                  <div className="subject-stats">
                    <span>
                      {stats.completed}/{stats.total} séances
                    </span>
                    <span>
                      {stats.hours}h
                      {stats.remainingMinutes > 0
                        ? `${stats.remainingMinutes}min`
                        : ""}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="add-subject">
            <input
              type="text"
              placeholder="Nom de la matière..."
              value={newSubjectName}
              onChange={(e) => setNewSubjectName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addSubject()}
            />
            <button onClick={addSubject}>Ajouter</button>
          </div>
        </section>

        {/* Section Planning */}
        <section className="section">
          <h2>📅 Planning de la semaine</h2>
          <div className="planning-grid">
            {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map(
              (day, index) => {
                const daySlots = revisionSlots.filter((slot) => {
                  const slotDay = new Date(slot.date).getDay();
                  return (
                    slotDay === (index === 0 ? 1 : index === 6 ? 0 : index + 1)
                  );
                });
                return (
                  <div key={day} className="day-column">
                    <h3>{day}</h3>
                    {daySlots.map((slot) => {
                      const subject = subjects.find(
                        (s) => s.id === slot.subjectId
                      );
                      return (
                        <div
                          key={slot.id}
                          className={`revision-slot ${
                            slot.completed ? "completed" : ""
                          }`}
                          style={{ borderColor: subject?.color }}
                          onClick={() => toggleSlotCompleted(slot.id)}
                        >
                          <div className="slot-subject">{subject?.name}</div>
                          <div className="slot-duration">
                            {slot.duration}min
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              }
            )}
          </div>
        </section>

        {/* Section Statistiques */}
        <section className="section">
          <h2>📊 Statistiques</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">{revisionSlots.length}</div>
              <div className="stat-label">Séances planifiées</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">
                {revisionSlots.filter((s) => s.completed).length}
              </div>
              <div className="stat-label">Séances complétées</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">
                {Math.floor(
                  revisionSlots.reduce((sum, slot) => sum + slot.duration, 0) /
                    60
                )}
                h
              </div>
              <div className="stat-label">Heures de révision</div>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <p>
          Développé par <a href="https://www.kopio.eu">KOPIO</a> - Outil
          open-source
        </p>
        <p>
          <a href="https://github.com/kopio/planificateur-revision-kopio">
            ⭐ Donner une étoile sur GitHub
          </a>
        </p>
      </footer>
    </div>
  );
}

export default App;
