const editToggleBtn = document.getElementById('edit-toggle');
const tagsDisplay = document.getElementById('tags-display');
const editControls = document.getElementById('edit-controls');
const tagsEditList = document.getElementById('tags-edit-list');
const newTagInput = document.getElementById('new-tag-input');
const addTagButton = document.getElementById('add-tag-button');
const saveTagsButton = document.getElementById('save-tags-button');
const copyButton = document.getElementById('copy-button'); // 获取复制按钮

let currentTagsArray = [];
let sortableInstance = null;

// --- API 调用 ---

async function fetchTags() {
    try {
        const response = await fetch('/tags');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        currentTagsArray = await response.json();
        console.log('标签已获取:', currentTagsArray);
        renderTagsDisplay();
    } catch (error) {
        console.error('获取标签失败:', error);
        tagsDisplay.textContent = '加载标签失败，请检查服务器状态...';
        editToggleBtn.disabled = true;
        editToggleBtn.textContent = '无法编辑 (加载失败)';
        copyButton.disabled = true; // 加载失败时禁用复制按钮
        copyButton.textContent = '复制失败';
    }
}

async function saveTags(tagsToSave) {
    try {
        const response = await fetch('/tags', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(tagsToSave)
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        console.log('标签已保存。');
        currentTagsArray = tagsToSave;
        renderTagsDisplay();
        return true;
    } catch (error) {
        console.error('保存标签失败:', error);
        alert('保存标签失败！请检查控制台了解详情。');
        return false;
    }
}

// --- 渲染函数 ---

function renderTagsDisplay() {
    // 使用空格连接标签并显示
    tagsDisplay.textContent = currentTagsArray.join(' ');
}

function renderEditableTags() {
    tagsEditList.innerHTML = '';

    currentTagsArray.forEach((tag, index) => {
        const tagItem = document.createElement('div');
        tagItem.classList.add('tag-edit-item');

        const tagText = document.createElement('span');
        tagText.textContent = tag;

        const deleteButton = document.createElement('span');
        deleteButton.classList.add('delete-tag');
        deleteButton.textContent = 'X';
        deleteButton.addEventListener('click', () => {
            deleteTag(index);
        });

        tagItem.appendChild(tagText);
        tagItem.appendChild(deleteButton);

        tagsEditList.appendChild(tagItem);
    });

    if (sortableInstance) {
        sortableInstance.destroy();
    }
    sortableInstance = Sortable.create(tagsEditList, {
        animation: 150,
        ghostClass: 'sortable-ghost',
        dragClass: 'sortable-drag',
        handle: '.tag-edit-item',
        onEnd: function (evt) {
            const [movedItem] = currentTagsArray.splice(evt.oldIndex, 1);
            currentTagsArray.splice(evt.newIndex, 0, movedItem);
            console.log('数组已按拖拽结果重新排序:', currentTagsArray);
        }
    });
     console.log('SortableJS 实例已创建.');
}

// --- 编辑逻辑 ---

function toggleEditMode() {
    const isEditing = editControls.style.display !== 'none';

    if (!isEditing) {
        // 进入编辑模式
        editToggleBtn.textContent = '退出编辑模式';
        tagsDisplay.style.display = 'none';
        editControls.style.display = 'block';
        document.body.classList.add('editing'); // 添加 class 到 body
        renderEditableTags();
    } else {
        // 退出编辑模式 (不保存)
        if (confirm("确定退出编辑模式？未保存的修改将会丢失。")) {
            exitEditMode();
        }
    }
}

function addTag() {
    const newTag = newTagInput.value.trim();
    if (newTag && !currentTagsArray.includes(newTag)) {
        currentTagsArray.push(newTag);
        newTagInput.value = '';
        renderEditableTags();
        tagsEditList.scrollTop = tagsEditList.scrollHeight;
    } else if (currentTagsArray.includes(newTag)) {
         alert('该标签已存在！');
         newTagInput.value = '';
    }
}

function deleteTag(indexToDelete) {
    console.log('尝试删除索引:', indexToDelete, '标签:', currentTagsArray[indexToDelete]);
    if (indexToDelete > -1 && indexToDelete < currentTagsArray.length) {
        currentTagsArray.splice(indexToDelete, 1);
        console.log('删除后数组:', currentTagsArray);
        renderEditableTags();
    }
}

async function saveAndExitEditMode() {
    const saveSuccessful = await saveTags(currentTagsArray);
    if (saveSuccessful) {
        exitEditMode();
    }
}

function exitEditMode() {
    editToggleBtn.textContent = '进入编辑模式';
    tagsDisplay.style.display = 'inline';
    editControls.style.display = 'none';
    document.body.classList.remove('editing'); // 移除 class 从 body

    if (sortableInstance) {
        sortableInstance.destroy();
        sortableInstance = null;
         console.log('SortableJS 实例已销毁.');
    }

    fetchTags();
}

// --- 复制功能 ---

async function copyTextToClipboard() {
    // 获取要复制的完整文本
    const prefix = document.querySelector('.prefix').textContent;
    const tags = tagsDisplay.textContent; // 这是已经用空格连接好的文本
    const suffix = document.querySelector('.suffix').textContent;
    const fullText = prefix + tags + suffix;

    try {
        // 使用 Clipboard API 复制文本
        await navigator.clipboard.writeText(fullText);
        console.log('文本已成功复制到剪贴板');

        // 提供用户反馈
        const originalText = copyButton.textContent;
        copyButton.textContent = '已复制！';
        copyButton.disabled = true; // 复制成功后短时间禁用按钮
        setTimeout(() => {
            copyButton.textContent = originalText;
            copyButton.disabled = false; // 恢复按钮
        }, 2000); // 2秒后恢复
    } catch (err) {
        console.error('复制文本失败:', err);
        alert('复制文本失败！请检查浏览器控制台或权限设置。'); // 提示用户失败
    }
}

// --- 事件监听器 ---

editToggleBtn.addEventListener('click', toggleEditMode);
addTagButton.addEventListener('click', addTag);
newTagInput.addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        addTag();
    }
});
saveTagsButton.addEventListener('click', saveAndExitEditMode);
copyButton.addEventListener('click', copyTextToClipboard); // 添加复制按钮的事件监听器


// --- 初始化 ---

fetchTags(); // 页面加载完成后，立即获取并显示标签