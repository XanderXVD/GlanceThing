import React, { useContext, useEffect, useRef, useState } from "react";

// Import context voor modalen
import { ModalContext } from "@/contexts/ModalContext.js";

import styles from "./Shortcuts.module.css";

// Interface voor de snelkoppeling
interface Shortcut {
  id: string;
  command: string;
}

const Shortcuts: React.FC = () => {
  // Gebruik de context voor het openen en sluiten van de shortcut editor
  const { shortcutsEditorOpen, setShortcutsEditorOpen } =
    useContext(ModalContext);
  const uploadImageRef = useRef<HTMLImageElement>(null);

  // Sluit de editor bij klikken buiten het editor-venster
  function onClickBackground(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) {
      setShortcutsEditorOpen(false);
    }
  }

  const [shortcuts, setShortcuts] = useState<Shortcut[] | null>(null); // Snelkoppelingen ophalen en beheren

  const [adding, setAdding] = useState<boolean>(false); // Modal voor nieuwe shortcut toevoegen
  const [newShortcutCommand, setNewShortcutCommand] = useState<string>(""); // Nieuw commando voor shortcut

  const [editing, setEditing] = useState<boolean>(false); // Modal voor shortcut bewerken
  const [editingShortcut, setEditingShortcut] = useState<Shortcut>({
    id: "",
    command: "",
  });

  // Haal bestaande snelkoppelingen op bij laden van de component
  useEffect(() => {
    window.api.getShortcuts().then((shortcuts) => {
      setShortcuts(shortcuts);
    });
  }, []);

  // Voeg een nieuwe snelkoppeling toe
  async function addShortcut(command: string) {
    if (!command) return;

    const id = crypto.randomUUID(); // Genereer uniek ID voor de snelkoppeling

    const shortcut: Shortcut = {
      id,
      command,
    };

    await window.api.addShortcut(shortcut);

    setShortcuts((shortcuts) => [...(shortcuts || []), shortcut]); // Voeg toe aan de lijst

    setAdding(false);
    setNewShortcutCommand("");
    uploadImageRef.current!.src = "";
  }

  // Verwijder een snelkoppeling
  async function removeShortcut(id: string) {
    await window.api.removeShortcut(id);

    setShortcuts(
      (shortcuts) => shortcuts && shortcuts.filter((s) => s.id !== id) // Filter verwijderde snelkoppeling uit de lijst
    );

    setEditing(false);
  }

  // Werk een bestaande snelkoppeling bij
  async function updateShortcut(shortcut: Shortcut) {
    await window.api.updateShortcut(shortcut);

    setShortcuts(
      (shortcuts) =>
        shortcuts && shortcuts.map((s) => (s.id === shortcut.id ? shortcut : s))
    );

    setEditing(false);
  }

  // Sluit de modal voor het toevoegen van een shortcut
  async function handleAddShortcutClose() {
    window.api.removeNewShortcutImage();
    setAdding(false);
    setNewShortcutCommand("");
    uploadImageRef.current!.src = "";
  }

  return (
    <div
      className={styles.shortcuts}
      data-open={shortcutsEditorOpen}
      onClick={onClickBackground}
    >
      {/* Weergave van bestaande snelkoppelingen */}
      {shortcuts ? (
        <div className={styles.grid}>
          {shortcuts.map((shortcut) => (
            <div
              className={styles.shortcut}
              key={shortcut.id}
              onClick={() => {
                setEditing(true);
                setEditingShortcut(shortcut);
              }}
            >
              <img src={`shortcut://${shortcut.id}`} />
            </div>
          ))}
          {/* Toevoegen knop zichtbaar als er minder dan 8 snelkoppelingen zijn */}
          {shortcuts.length < 8 ? (
            <div
              className={styles.shortcut}
              data-type="add"
              onClick={() => setAdding(true)}
            >
              <span className="material-icons">add</span>
            </div>
          ) : null}
        </div>
      ) : null}

      {/* Modal voor het toevoegen van een nieuwe snelkoppeling */}
      <div
        className={styles.modal}
        data-shown={adding}
        onClick={(e) =>
          e.target === e.currentTarget && handleAddShortcutClose()
        }
      >
        <div className={styles.modalContent}>
          <h1>
            Add Shortcut
            <button onClick={() => handleAddShortcutClose()}>
              <span className="material-icons">close</span>
            </button>
          </h1>
          <button
            className={styles.uploadImage}
            onClick={async () => {
              const res = await window.api.uploadShortcutImage("new");
              if (!res) return;
              uploadImageRef.current!.src = `shortcut://new?${Date.now()}`;
            }}
          >
            <img ref={uploadImageRef} src="" alt="" />
            <span className={styles.hint}>
              <span className="material-icons">upload</span>
              Image
            </span>
          </button>
          <input
            type="text"
            placeholder="Command"
            value={newShortcutCommand}
            onChange={(e) => setNewShortcutCommand(e.target.value)}
          />
          <div className={styles.buttons}>
            <button onClick={() => addShortcut(newShortcutCommand)}>Add</button>
          </div>
        </div>
      </div>

      {/* Modal voor het bewerken van een bestaande snelkoppeling */}
      <div
        className={styles.modal}
        data-shown={editing}
        onClick={(e) => e.target === e.currentTarget && setEditing(false)}
      >
        <div className={styles.modalContent}>
          <h1>
            Edit Shortcut
            <button onClick={() => setEditing(false)}>
              <span className="material-icons">close</span>
            </button>
          </h1>
          <input
            type="text"
            placeholder="Command"
            value={editingShortcut.command}
            onChange={(e) =>
              setEditingShortcut({
                ...editingShortcut,
                command: e.target.value,
              })
            }
          />
          <div className={styles.buttons}>
            <button
              onClick={() => removeShortcut(editingShortcut.id)}
              data-type="danger"
            >
              Delete
            </button>
            <button onClick={() => updateShortcut(editingShortcut!)}>
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Shortcuts;
