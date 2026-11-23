export class RightsDialog {
  constructor({ apiBase = '/api/rights', onSaved = null } = {}) {
    this.apiBase = apiBase;
    this.onSaved = onSaved;
    this.currentUserId = null;
    this.modules = [];
    this.backdropEl = null;
  }

  async open(userId, actorHeaders = {}) {
    this.currentUserId = userId;
    this.actorHeaders = actorHeaders;

    const res = await fetch(`${this.apiBase}/matrix?userId=${encodeURIComponent(userId)}`, {
      headers: {
        'Content-Type': 'application/json',
        ...actorHeaders,
      },
    });
    const data = await res.json();
    if (!res.ok || !data.ok) {
      throw new Error(data.error || 'Failed to load rights matrix');
    }

    this.modules = data.modules || [];
    this.render(data.user);
  }

  close() {
    if (this.backdropEl && this.backdropEl.parentNode) {
      this.backdropEl.parentNode.removeChild(this.backdropEl);
    }
    this.backdropEl = null;
  }

  setAllRights(granted) {
    for (const mod of this.modules) {
      for (const right of mod.rights) {
        right.granted = Boolean(granted);
      }
    }
    this.syncDomState();
  }

  setModuleRights(moduleId, granted) {
    const mod = this.modules.find((m) => m.module_id === moduleId);
    if (!mod) return;
    for (const right of mod.rights) {
      right.granted = Boolean(granted);
    }
    this.syncDomState();
  }

  syncDomState() {
    if (!this.backdropEl) return;

    for (const mod of this.modules) {
      const total = mod.rights.length;
      const checkedCount = mod.rights.filter((r) => r.granted).length;
      const modCheckbox = this.backdropEl.querySelector(
        `input[data-module-checkbox="${mod.module_id}"]`
      );
      if (modCheckbox) {
        modCheckbox.checked = total > 0 && checkedCount === total;
        modCheckbox.indeterminate = checkedCount > 0 && checkedCount < total;
      }

      for (const right of mod.rights) {
        const rightCheckbox = this.backdropEl.querySelector(
          `input[data-right-id="${right.right_id}"]`
        );
        if (rightCheckbox) {
          rightCheckbox.checked = Boolean(right.granted);
        }
      }
    }
  }

  collectPayload() {
    const rights = [];
    for (const mod of this.modules) {
      for (const right of mod.rights) {
        rights.push({
          right_id: right.right_id,
          granted: Boolean(right.granted),
        });
      }
    }
    return { rights };
  }

  async save() {
    const payload = this.collectPayload();
    const res = await fetch(`${this.apiBase}/users/${encodeURIComponent(this.currentUserId)}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...this.actorHeaders,
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok || !data.ok) {
      throw new Error(data.error || 'Failed to save rights');
    }
    if (typeof this.onSaved === 'function') {
      this.onSaved(data);
    }
    this.close();
    return data;
  }

  render(targetUser) {
    this.close();

    const backdrop = document.createElement('div');
    backdrop.className = 'hope-rights-backdrop';
    backdrop.style.cssText =
      'position:fixed;inset:0;background:rgba(0,0,0,0.45);display:flex;align-items:center;justify-content:center;z-index:9999;';

    const dialog = document.createElement('div');
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    dialog.style.cssText =
      'background:#fff;color:#111;width:min(780px,94vw);max-height:86vh;overflow:auto;border-radius:8px;padding:20px;box-shadow:0 12px 32px rgba(0,0,0,0.25);';

    const header = document.createElement('div');
    header.style.cssText =
      'display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #e5e7eb;padding-bottom:12px;margin-bottom:14px;';
    header.innerHTML = `
      <div>
        <h2 style="margin:0;font-size:18px;">Assign User Rights</h2>
        <p style="margin:4px 0 0;font-size:13px;color:#4b5563;">
          ${targetUser.first_name || ''} ${targetUser.last_name || ''} (${targetUser.email}) — Role: <strong>${targetUser.role_code}</strong>
        </p>
      </div>
    `;

    const toolbar = document.createElement('div');
    toolbar.style.cssText = 'display:flex;gap:8px;margin-bottom:16px;';

    const allBtn = document.createElement('button');
    allBtn.type = 'button';
    allBtn.textContent = 'All';
    allBtn.addEventListener('click', () => this.setAllRights(true));

    const noneBtn = document.createElement('button');
    noneBtn.type = 'button';
    noneBtn.textContent = 'None';
    noneBtn.addEventListener('click', () => this.setAllRights(false));

    toolbar.appendChild(allBtn);
    toolbar.appendChild(noneBtn);

    const listContainer = document.createElement('div');
    listContainer.style.cssText = 'display:grid;gap:12px;';

    for (const mod of this.modules) {
      const card = document.createElement('section');
      card.style.cssText = 'border:1px solid #e5e7eb;border-radius:6px;padding:12px;';

      const modHeader = document.createElement('div');
      modHeader.style.cssText =
        'display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;font-weight:600;';

      const modLabel = document.createElement('label');
      modLabel.style.cssText = 'display:flex;align-items:center;gap:8px;cursor:pointer;';

      const modCheckbox = document.createElement('input');
      modCheckbox.type = 'checkbox';
      modCheckbox.setAttribute('data-module-checkbox', String(mod.module_id));
      modCheckbox.addEventListener('change', (e) => {
        this.setModuleRights(mod.module_id, e.target.checked);
      });

      const modTitle = document.createElement('span');
      modTitle.textContent = mod.module_name || mod.module_code;

      modLabel.appendChild(modCheckbox);
      modLabel.appendChild(modTitle);
      modHeader.appendChild(modLabel);
      card.appendChild(modHeader);

      const rightsGrid = document.createElement('div');
      rightsGrid.style.cssText =
        'display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:8px;padding-left:20px;';

      for (const right of mod.rights) {
        const rLabel = document.createElement('label');
        rLabel.style.cssText = 'display:flex;align-items:center;gap:6px;font-size:14px;cursor:pointer;';

        const rCheckbox = document.createElement('input');
        rCheckbox.type = 'checkbox';
        rCheckbox.setAttribute('data-right-id', String(right.right_id));
        rCheckbox.checked = Boolean(right.granted);
        rCheckbox.addEventListener('change', (e) => {
          right.granted = e.target.checked;
          this.syncDomState();
        });

        const rText = document.createElement('span');
        rText.textContent = right.right_label || right.perm_key;

        rLabel.appendChild(rCheckbox);
        rLabel.appendChild(rText);
        rightsGrid.appendChild(rLabel);
      }

      card.appendChild(rightsGrid);
      listContainer.appendChild(card);
    }

    const errorBox = document.createElement('div');
    errorBox.style.cssText = 'color:#b91c1c;font-size:13px;min-height:18px;margin-top:12px;';

    const footer = document.createElement('div');
    footer.style.cssText =
      'display:flex;justify-content:flex-end;gap:10px;border-top:1px solid #e5e7eb;padding-top:12px;margin-top:14px;';

    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.addEventListener('click', () => this.close());

    const saveBtn = document.createElement('button');
    saveBtn.type = 'button';
    saveBtn.textContent = 'Save Rights';
    saveBtn.addEventListener('click', async () => {
      saveBtn.disabled = true;
      errorBox.textContent = '';
      try {
        await this.save();
      } catch (err) {
        errorBox.textContent = err.message;
        saveBtn.disabled = false;
      }
    });

    footer.appendChild(cancelBtn);
    footer.appendChild(saveBtn);

    dialog.appendChild(header);
    dialog.appendChild(toolbar);
    dialog.appendChild(listContainer);
    dialog.appendChild(errorBox);
    dialog.appendChild(footer);
    backdrop.appendChild(dialog);
    document.body.appendChild(backdrop);

    this.backdropEl = backdrop;
    this.syncDomState();
  }
}