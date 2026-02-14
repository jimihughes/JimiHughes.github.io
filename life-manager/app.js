// ============================================================
// Life Manager — Vanilla JS Application
// ============================================================

(function () {
  'use strict';

  // ===== Utility helpers =====
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
  const uid = () => crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2);

  // ===== Data Layer =====
  const STORAGE_KEY = 'life_manager_data';

  function defaultData() {
    return { lists: [], tasks: [] };
  }

  function loadData() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const d = JSON.parse(raw);
        return { lists: d.lists || [], tasks: d.tasks || [] };
      }
    } catch (e) { /* ignore */ }
    return defaultData();
  }

  function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  let data = loadData();

  // ===== Data accessors =====
  function getList(id) {
    return data.lists.find(l => l.id === id);
  }

  function getChildLists(parentId) {
    return data.lists.filter(l => l.parentId === parentId);
  }

  function getRootLists() {
    return data.lists.filter(l => !l.parentId);
  }

  function getTasksForList(listId) {
    return data.tasks.filter(t => t.listId === listId && !t.completed);
  }

  function getAllDescendantListIds(listId) {
    const ids = [listId];
    const children = getChildLists(listId);
    for (const child of children) {
      ids.push(...getAllDescendantListIds(child.id));
    }
    return ids;
  }

  function getTaskCountForList(listId) {
    const ids = getAllDescendantListIds(listId);
    return data.tasks.filter(t => ids.includes(t.listId) && !t.completed).length;
  }

  function getCompletedTasks() {
    return data.tasks.filter(t => t.completed).sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0));
  }

  function getUpcomingTasks() {
    return data.tasks
      .filter(t => !t.completed && t.deadline)
      .sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
  }

  function getListPath(listId) {
    const parts = [];
    let current = getList(listId);
    while (current) {
      parts.unshift(current.name);
      current = current.parentId ? getList(current.parentId) : null;
    }
    return parts.join(' / ');
  }

  // ===== State =====
  let currentView = 'upcoming'; // 'upcoming' | 'completed' | listId
  let editingTaskId = null;

  // ===== DOM refs =====
  const listsTreeEl = $('#lists-tree');
  const viewUpcoming = $('#view-upcoming');
  const viewCompleted = $('#view-completed');
  const viewList = $('#view-list');
  const upcomingTasksEl = $('#upcoming-tasks');
  const completedTasksEl = $('#completed-tasks');
  const listTasksEl = $('#list-tasks');
  const listTitle = $('#list-title');
  const listSublistsEl = $('#list-sublists');
  const newTaskInput = $('#new-task-input');
  const addTaskBtn = $('#add-task-btn');
  const groupBySelect = $('#group-by-select');
  const addSublistBtn = $('#add-sublist-btn');
  const deleteListBtn = $('#delete-list-btn');
  const addRootListBtn = $('#add-root-list-btn');

  // Modal refs
  const taskModal = $('#task-modal');
  const modalTitle = $('#modal-title');
  const modalDeadline = $('#modal-deadline');
  const modalNotes = $('#modal-notes');
  const modalRecurrence = $('#modal-recurrence');
  const modalSave = $('#modal-save');
  const modalClose = $('#modal-close');
  const modalDeleteTask = $('#modal-delete-task');

  const confirmModal = $('#confirm-modal');
  const confirmMessage = $('#confirm-message');
  const confirmOk = $('#confirm-ok');
  const confirmCancel = $('#confirm-cancel');
  const confirmClose = $('#confirm-close');

  let confirmCallback = null;

  // ===== Rendering =====

  function render() {
    renderSidebar();
    renderCurrentView();
  }

  function renderSidebar() {
    // Update active state on special nav items
    $$('.nav-special').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === currentView);
    });

    // Render list tree
    listsTreeEl.innerHTML = '';
    const roots = getRootLists();
    for (const list of roots) {
      listsTreeEl.appendChild(renderListTreeNode(list));
    }
  }

  function renderListTreeNode(list) {
    const children = getChildLists(list.id);
    const hasChildren = children.length > 0;
    const count = getTaskCountForList(list.id);

    const wrapper = document.createElement('div');
    wrapper.className = 'list-tree-node';

    const row = document.createElement('div');
    row.className = 'list-tree-item';

    // Toggle arrow (only if has children)
    if (hasChildren) {
      const toggle = document.createElement('button');
      toggle.className = 'list-toggle' + (list.expanded !== false ? ' expanded' : '');
      toggle.innerHTML = '&#9654;';
      toggle.addEventListener('click', (e) => {
        e.stopPropagation();
        list.expanded = !list.expanded;
        saveData();
        renderSidebar();
      });
      row.appendChild(toggle);
    }

    const btn = document.createElement('button');
    btn.className = 'nav-item' + (currentView === list.id ? ' active' : '');
    btn.innerHTML = `
      <span class="nav-icon">&#128203;</span>
      <span>${escapeHtml(list.name)}</span>
      ${count > 0 ? `<span class="task-count-badge">${count}</span>` : ''}
    `;
    btn.addEventListener('click', () => switchToList(list.id));
    row.appendChild(btn);

    wrapper.appendChild(row);

    // Children
    if (hasChildren && list.expanded !== false) {
      const childContainer = document.createElement('div');
      childContainer.className = 'list-tree-children';
      for (const child of children) {
        childContainer.appendChild(renderListTreeNode(child));
      }
      wrapper.appendChild(childContainer);
    }

    return wrapper;
  }

  function renderCurrentView() {
    viewUpcoming.classList.toggle('active', currentView === 'upcoming');
    viewCompleted.classList.toggle('active', currentView === 'completed');
    viewList.classList.toggle('active', currentView !== 'upcoming' && currentView !== 'completed');

    if (currentView === 'upcoming') {
      renderUpcomingView();
    } else if (currentView === 'completed') {
      renderCompletedView();
    } else {
      renderListView(currentView);
    }
  }

  // ----- Upcoming View -----
  function renderUpcomingView() {
    upcomingTasksEl.innerHTML = '';
    const tasks = getUpcomingTasks();

    const emptyEl = $('#upcoming-empty');
    emptyEl.classList.toggle('visible', tasks.length === 0);
    if (tasks.length === 0) return;

    const today = todayStr();
    const groups = groupTasksByDeadline(tasks, today);

    for (const group of groups) {
      const header = document.createElement('div');
      header.className = 'date-group-header' +
        (group.type === 'overdue' ? ' overdue-header' : '') +
        (group.type === 'today' ? ' today-header' : '');
      header.textContent = group.label;
      upcomingTasksEl.appendChild(header);

      for (const task of group.tasks) {
        upcomingTasksEl.appendChild(renderTaskItem(task, true));
      }
    }
  }

  function groupTasksByDeadline(tasks, today) {
    const groups = [];
    const overdue = tasks.filter(t => t.deadline < today);
    const todayTasks = tasks.filter(t => t.deadline === today);
    const upcoming = tasks.filter(t => t.deadline > today);

    if (overdue.length) groups.push({ type: 'overdue', label: 'Overdue', tasks: overdue });
    if (todayTasks.length) groups.push({ type: 'today', label: 'Today', tasks: todayTasks });

    // Group upcoming by date
    const byDate = {};
    for (const t of upcoming) {
      if (!byDate[t.deadline]) byDate[t.deadline] = [];
      byDate[t.deadline].push(t);
    }
    for (const [date, dateTasks] of Object.entries(byDate)) {
      groups.push({ type: 'future', label: formatDateLabel(date), tasks: dateTasks });
    }

    return groups;
  }

  // ----- Completed View -----
  function renderCompletedView() {
    completedTasksEl.innerHTML = '';
    const tasks = getCompletedTasks();

    const emptyEl = $('#completed-empty');
    emptyEl.classList.toggle('visible', tasks.length === 0);

    for (const task of tasks) {
      completedTasksEl.appendChild(renderTaskItem(task, true, true));
    }
  }

  // ----- List View -----
  function renderListView(listId) {
    const list = getList(listId);
    if (!list) {
      currentView = 'upcoming';
      render();
      return;
    }

    listTitle.textContent = list.name;
    groupBySelect.value = list.groupBy || '';

    // Sub-lists
    listSublistsEl.innerHTML = '';
    const children = getChildLists(listId);
    for (const child of children) {
      const chip = document.createElement('button');
      chip.className = 'sublist-chip';
      const c = getTaskCountForList(child.id);
      chip.innerHTML = `<span>${escapeHtml(child.name)}</span>${c > 0 ? `<span class="chip-count">(${c})</span>` : ''}`;
      chip.addEventListener('click', () => switchToList(child.id));
      listSublistsEl.appendChild(chip);
    }

    // Tasks
    listTasksEl.innerHTML = '';
    const tasks = getTasksForList(listId);
    const emptyEl = $('#list-empty');
    emptyEl.classList.toggle('visible', tasks.length === 0);

    if (list.groupBy === 'frequency' && tasks.length > 0) {
      const freqOrder = ['daily', 'weekly', 'monthly', ''];
      const freqLabels = { daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly', '': 'One-time' };
      const grouped = {};
      for (const freq of freqOrder) grouped[freq] = [];
      for (const task of tasks) {
        const key = task.recurrence || '';
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(task);
      }
      for (const freq of freqOrder) {
        if (grouped[freq].length === 0) continue;
        const header = document.createElement('div');
        header.className = 'freq-group-header';
        header.textContent = freqLabels[freq];
        listTasksEl.appendChild(header);
        for (const task of grouped[freq]) {
          listTasksEl.appendChild(renderTaskItem(task, false));
        }
      }
    } else {
      for (const task of tasks) {
        listTasksEl.appendChild(renderTaskItem(task, false));
      }
    }
  }

  // ----- Task Item -----
  function renderTaskItem(task, showListTag = false, isCompletedView = false) {
    const el = document.createElement('div');
    el.className = 'task-item';
    el.dataset.taskId = task.id;

    const today = todayStr();
    let deadlineClass = '';
    let deadlineText = '';
    if (task.deadline && !task.completed) {
      if (task.deadline < today) { deadlineClass = 'overdue'; deadlineText = 'Overdue — ' + formatDateShort(task.deadline); }
      else if (task.deadline === today) { deadlineClass = 'today'; deadlineText = 'Today'; }
      else {
        const diff = daysDiff(today, task.deadline);
        if (diff <= 3) { deadlineClass = 'soon'; }
        deadlineText = formatDateShort(task.deadline);
      }
    } else if (task.deadline && task.completed) {
      deadlineText = formatDateShort(task.deadline);
    }

    el.innerHTML = `
      <div class="task-checkbox ${task.completed ? 'checked' : ''}" data-action="toggle"></div>
      <div class="task-content" data-action="edit">
        <div class="task-title">${escapeHtml(task.title)}</div>
        <div class="task-meta">
          ${deadlineText ? `<span class="task-deadline ${deadlineClass}">${deadlineText}</span>` : ''}
          ${task.recurrence ? `<span class="task-recurrence-badge">\u21BB ${task.recurrence}</span>` : ''}
          ${task.notes ? `<span class="task-notes-indicator">&#128221; Notes</span>` : ''}
          ${showListTag ? `<span class="task-list-tag">${escapeHtml(getListPath(task.listId))}</span>` : ''}
        </div>
      </div>
    `;

    // Checkbox click
    const checkbox = el.querySelector('[data-action="toggle"]');
    checkbox.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleTask(task.id, el, isCompletedView);
    });

    // Click to edit
    el.querySelector('[data-action="edit"]').addEventListener('click', () => openTaskModal(task.id));

    return el;
  }

  // ===== Actions =====

  function switchView(view) {
    currentView = view;
    render();
  }

  function switchToList(listId) {
    currentView = listId;
    render();
  }

  function addList(parentId, name) {
    const list = {
      id: uid(),
      name: name.trim(),
      parentId: parentId || null,
      expanded: true,
      createdAt: Date.now()
    };
    data.lists.push(list);
    saveData();
    render();
    return list;
  }

  function deleteList(listId) {
    const ids = getAllDescendantListIds(listId);
    data.lists = data.lists.filter(l => !ids.includes(l.id));
    data.tasks = data.tasks.filter(t => !ids.includes(t.listId));
    saveData();
    if (ids.includes(currentView)) {
      currentView = 'upcoming';
    }
    render();
  }

  function renameList(listId, newName) {
    const list = getList(listId);
    if (list && newName.trim()) {
      list.name = newName.trim();
      saveData();
      renderSidebar();
    }
  }

  function addTask(listId, title) {
    const task = {
      id: uid(),
      listId,
      title: title.trim(),
      notes: '',
      deadline: '',
      recurrence: '',
      completed: false,
      completedAt: null,
      createdAt: Date.now()
    };
    data.tasks.push(task);
    saveData();
    render();
    return task;
  }

  function calcNextDeadline(dateStr, recurrence) {
    const d = new Date(dateStr + 'T00:00:00');
    if (recurrence === 'daily') d.setDate(d.getDate() + 1);
    else if (recurrence === 'weekly') d.setDate(d.getDate() + 7);
    else if (recurrence === 'monthly') d.setMonth(d.getMonth() + 1);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  function toggleTask(taskId, el, isCompletedView) {
    const task = data.tasks.find(t => t.id === taskId);
    if (!task) return;

    if (!task.completed) {
      // Mark as completed with animation
      task.completed = true;
      task.completedAt = Date.now();
      el.classList.add('completing');
      el.querySelector('.task-checkbox').classList.add('checked');

      // If recurring, spawn next instance
      if (task.recurrence && task.deadline) {
        const nextDeadline = calcNextDeadline(task.deadline, task.recurrence);
        const nextTask = {
          id: uid(),
          listId: task.listId,
          title: task.title,
          notes: task.notes,
          deadline: nextDeadline,
          recurrence: task.recurrence,
          completed: false,
          completedAt: null,
          createdAt: Date.now()
        };
        data.tasks.push(nextTask);
      }

      setTimeout(() => {
        saveData();
        render();
      }, 500);
    } else {
      // Uncomplete
      task.completed = false;
      task.completedAt = null;
      el.classList.add('uncompleting');
      saveData();
      setTimeout(() => render(), 300);
    }
  }

  function deleteTask(taskId) {
    data.tasks = data.tasks.filter(t => t.id !== taskId);
    saveData();
    render();
  }

  // ===== Task Modal =====

  function openTaskModal(taskId) {
    const task = data.tasks.find(t => t.id === taskId);
    if (!task) return;
    editingTaskId = taskId;
    modalTitle.value = task.title;
    modalDeadline.value = task.deadline || '';
    modalRecurrence.value = task.recurrence || '';
    modalNotes.value = task.notes || '';
    taskModal.classList.remove('hidden');
    modalTitle.focus();
  }

  function closeTaskModal() {
    taskModal.classList.add('hidden');
    editingTaskId = null;
  }

  function saveTaskModal() {
    if (!editingTaskId) return;
    const task = data.tasks.find(t => t.id === editingTaskId);
    if (!task) return;
    const title = modalTitle.value.trim();
    if (!title) return;
    task.title = title;
    task.deadline = modalDeadline.value || '';
    task.recurrence = modalRecurrence.value || '';
    task.notes = modalNotes.value || '';
    saveData();
    closeTaskModal();
    render();
  }

  // ===== Confirm Modal =====

  function showConfirm(message, callback) {
    confirmMessage.textContent = message;
    confirmCallback = callback;
    confirmModal.classList.remove('hidden');
  }

  function closeConfirm() {
    confirmModal.classList.add('hidden');
    confirmCallback = null;
  }

  // ===== Inline new list input =====

  function showNewListInput(parentId, containerEl) {
    // Remove any existing inputs
    $$('.new-list-input-wrap').forEach(el => el.remove());

    const tpl = $('#new-list-input-tpl');
    const clone = tpl.content.cloneNode(true);
    const wrap = clone.querySelector('.new-list-input-wrap');
    const input = clone.querySelector('.new-list-input');

    containerEl.appendChild(wrap);
    input.focus();

    function finish() {
      const name = input.value.trim();
      wrap.remove();
      if (name) {
        const newList = addList(parentId, name);
        // If adding a sub-list, expand the parent
        if (parentId) {
          const parent = getList(parentId);
          if (parent) { parent.expanded = true; saveData(); }
        }
        switchToList(newList.id);
      }
    }

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); finish(); }
      if (e.key === 'Escape') { wrap.remove(); }
    });

    input.addEventListener('blur', () => {
      setTimeout(finish, 100);
    });
  }

  // ===== Date helpers =====

  function todayStr() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  function formatDateShort(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return months[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear();
  }

  function formatDateLabel(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (dateStr === todayStr()) return 'Today';
    const tomStr = tomorrow.getFullYear() + '-' + String(tomorrow.getMonth() + 1).padStart(2, '0') + '-' + String(tomorrow.getDate()).padStart(2, '0');
    if (dateStr === tomStr) return 'Tomorrow';

    const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    return days[d.getDay()] + ', ' + months[d.getMonth()] + ' ' + d.getDate();
  }

  function daysDiff(a, b) {
    return Math.round((new Date(b + 'T00:00:00') - new Date(a + 'T00:00:00')) / 86400000);
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ===== Event Bindings =====

  // Sidebar special nav
  $$('.nav-special').forEach(btn => {
    btn.addEventListener('click', () => switchView(btn.dataset.view));
  });

  // Add root list
  addRootListBtn.addEventListener('click', () => {
    showNewListInput(null, listsTreeEl);
  });

  // Add task
  function handleAddTask() {
    const title = newTaskInput.value.trim();
    if (!title || currentView === 'upcoming' || currentView === 'completed') return;
    addTask(currentView, title);
    newTaskInput.value = '';
    newTaskInput.focus();
  }

  addTaskBtn.addEventListener('click', handleAddTask);
  newTaskInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleAddTask();
  });

  // Group-by selector
  groupBySelect.addEventListener('change', () => {
    if (currentView === 'upcoming' || currentView === 'completed') return;
    const list = getList(currentView);
    if (list) {
      list.groupBy = groupBySelect.value;
      saveData();
      renderCurrentView();
    }
  });

  // Add sub-list button
  addSublistBtn.addEventListener('click', () => {
    if (currentView === 'upcoming' || currentView === 'completed') return;
    showNewListInput(currentView, listSublistsEl);
  });

  // Delete list button
  deleteListBtn.addEventListener('click', () => {
    if (currentView === 'upcoming' || currentView === 'completed') return;
    const list = getList(currentView);
    if (!list) return;
    const count = getTaskCountForList(list.id);
    const childCount = getAllDescendantListIds(list.id).length - 1;
    let msg = `Delete "${list.name}"?`;
    if (count > 0 || childCount > 0) {
      msg += ` This will also delete ${count} task${count !== 1 ? 's' : ''}`;
      if (childCount > 0) msg += ` and ${childCount} sub-list${childCount !== 1 ? 's' : ''}`;
      msg += '.';
    }
    showConfirm(msg, () => deleteList(list.id));
  });

  // Rename list on blur / enter
  listTitle.addEventListener('blur', () => {
    if (currentView !== 'upcoming' && currentView !== 'completed') {
      renameList(currentView, listTitle.textContent);
    }
  });
  listTitle.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); listTitle.blur(); }
  });

  // Task modal
  modalClose.addEventListener('click', closeTaskModal);
  modalSave.addEventListener('click', saveTaskModal);
  modalDeleteTask.addEventListener('click', () => {
    if (editingTaskId) {
      const id = editingTaskId;
      closeTaskModal();
      deleteTask(id);
    }
  });
  taskModal.addEventListener('click', (e) => {
    if (e.target === taskModal) closeTaskModal();
  });

  // Save on Enter in modal title
  modalTitle.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); saveTaskModal(); }
  });

  // Confirm modal
  confirmOk.addEventListener('click', () => {
    if (confirmCallback) confirmCallback();
    closeConfirm();
  });
  confirmCancel.addEventListener('click', closeConfirm);
  confirmClose.addEventListener('click', closeConfirm);
  confirmModal.addEventListener('click', (e) => {
    if (e.target === confirmModal) closeConfirm();
  });

  // Keyboard shortcut: Escape closes modals
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (!taskModal.classList.contains('hidden')) closeTaskModal();
      if (!confirmModal.classList.contains('hidden')) closeConfirm();
    }
  });

  // ===== Init =====
  render();

})();
