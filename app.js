// ==========================================
// Configuration & DOM Elements
// ==========================================

const API_URL = 'http://localhost:5000';

const authContainer = document.getElementById('auth-container');
const dashboardContainer = document.getElementById('dashboard-container');
const authForm = document.getElementById('auth-form');
const taskForm = document.getElementById('task-form');
const taskList = document.getElementById('task-list');
const authMessage = document.getElementById('auth-message');
const userDisplay = document.getElementById('user-display');
const logoutBtn = document.getElementById('logout-btn');
const filterBtns = document.querySelectorAll('.filter-btn');

// ==========================================
// Application State
// ==========================================

let token = localStorage.getItem('taskApp_token');
let currentUser = localStorage.getItem('taskApp_user');
let isLoginMode = true;
let tasks = [];
let currentFilter = 'all';

if (token && currentUser) {
    showDashboard();
}

// ==========================================
// Toast
// ==========================================

function showToast(message,type="success"){

const toast=document.getElementById("toast");

toast.innerText=message;

toast.className="show "+type;

setTimeout(()=>{
toast.className="";
},3000);

}

// ==========================================
// Toggle Login / Signup
// ==========================================

document.getElementById('toggle-auth-link').addEventListener('click', (e) => {

    e.preventDefault();

    isLoginMode = !isLoginMode;

    document.getElementById('auth-title').innerText = isLoginMode ? 'Login' : 'Sign Up';

    document.getElementById('auth-btn').innerText = isLoginMode ? 'Login' : 'Sign Up';

    document.getElementById('toggle-auth-text').innerText =
        isLoginMode ? "Don't have an account?" : "Already have an account?";

    document.getElementById('toggle-auth-link').innerText =
        isLoginMode ? "Sign up" : "Login";

    authMessage.innerText = '';
});

// ==========================================
// Login / Signup
// ==========================================

authForm.addEventListener('submit', async (e) => {

    e.preventDefault();

    const username=document.getElementById('username').value.trim();
    const password=document.getElementById('password').value.trim();

    if(!username || !password){

        showToast("Please fill all fields","error");
        return;
    }

    const endpoint = isLoginMode ? '/api/auth/login' : '/api/auth/signup';

    try{

        const response=await fetch(`${API_URL}${endpoint}`,{

            method:'POST',

            headers:{'Content-Type':'application/json'},

            body:JSON.stringify({username,password})

        });

        const data=await response.json();

        if(!response.ok){

            throw new Error(data.error || "Something went wrong");
        }

        token=data.token;
        currentUser=data.username;

        localStorage.setItem('taskApp_token',token);
        localStorage.setItem('taskApp_user',currentUser);

        document.getElementById('username').value='';
        document.getElementById('password').value='';

        showDashboard();

        showToast(isLoginMode ? "Login successful ✅" : "Signup successful 🎉");

    }

    catch(err){

        showToast(err.message,"error");

    }

});

// ==========================================
// Logout
// ==========================================

logoutBtn.addEventListener('click',()=>{

    localStorage.removeItem('taskApp_token');
    localStorage.removeItem('taskApp_user');

    token=null;
    currentUser=null;
    tasks=[];

    dashboardContainer.classList.add('hidden');
    authContainer.classList.remove('hidden');

    showToast("Logged out successfully");

});

// ==========================================
// Dashboard
// ==========================================

function showDashboard(){

    authContainer.classList.add('hidden');

    dashboardContainer.classList.remove('hidden');

    userDisplay.innerText=currentUser;

    fetchTasks();

}

// ==========================================
// Fetch Tasks
// ==========================================

async function fetchTasks(){

    try{

        const response=await fetch(`${API_URL}/api/tasks`,{

            headers:{'Authorization':`Bearer ${token}`}

        });

        if(response.status===401 || response.status===403){

            logoutBtn.click();
            return;
        }

        tasks=await response.json();

        renderTasks();

    }

    catch(err){

        console.error("Failed to fetch tasks",err);

        showToast("Failed to fetch tasks","error");

    }

}

// ==========================================
// Add Task
// ==========================================

taskForm.addEventListener('submit',async(e)=>{

    e.preventDefault();

    const taskInput=document.getElementById('task-input');

    const title=taskInput.value.trim();

    if(!title) return;

    try{

        const response=await fetch(`${API_URL}/api/tasks`,{

            method:'POST',

            headers:{
                'Content-Type':'application/json',
                'Authorization':`Bearer ${token}`
            },

            body:JSON.stringify({title})

        });

        const newTask=await response.json();

        tasks.unshift(newTask);

        taskInput.value='';

        renderTasks();

        showToast("Task added successfully");

    }

    catch(err){

        console.error("Add task error",err);

        showToast("Failed to add task","error");

    }

});

// ==========================================
// Update Task
// ==========================================

window.toggleTask=async function(id,currentStatus){

    try{

        const response=await fetch(`${API_URL}/api/tasks/${id}`,{

            method:'PUT',

            headers:{
                'Content-Type':'application/json',
                'Authorization':`Bearer ${token}`
            },

            body:JSON.stringify({completed:!currentStatus})

        });

        const updatedTask=await response.json();

        tasks=tasks.map(task=>task._id===id ? updatedTask : task);

        renderTasks();

        showToast("Task updated");

    }

    catch(err){

        console.error("Update task error",err);

        showToast("Failed to update task","error");

    }

}

// ==========================================
// Delete Task
// ==========================================

window.deleteTask=async function(id){

    try{

        await fetch(`${API_URL}/api/tasks/${id}`,{

            method:'DELETE',

            headers:{'Authorization':`Bearer ${token}`}

        });

        tasks=tasks.filter(task=>task._id!==id);

        renderTasks();

        showToast("Task deleted");

    }

    catch(err){

        console.error("Delete task error",err);

        showToast("Failed to delete task","error");

    }

}

// ==========================================
// Filters
// ==========================================

filterBtns.forEach(btn=>{

    btn.addEventListener('click',(e)=>{

        filterBtns.forEach(b=>b.classList.remove('active'));

        e.target.classList.add('active');

        currentFilter=e.target.getAttribute('data-filter');

        renderTasks();

    });

});

// ==========================================
// Render Tasks
// ==========================================

function renderTasks(){

    taskList.innerHTML='';

    let filteredTasks=tasks;

    if(currentFilter==='pending'){

        filteredTasks=tasks.filter(task=>!task.completed);

    }

    else if(currentFilter==='completed'){

        filteredTasks=tasks.filter(task=>task.completed);

    }

    filteredTasks.forEach(task=>{

        const li=document.createElement('li');

        if(task.completed){

            li.classList.add('completed');

        }

        li.innerHTML=`

        <span>${task.title}</span>

        <div class="task-actions">

        <button onclick="toggleTask('${task._id}',${task.completed})">

        ${task.completed ? 'Undo' : 'Done'}

        </button>

        <button class="delete-btn" onclick="deleteTask('${task._id}')">

        Delete

        </button>

        </div>

        `;

        taskList.appendChild(li);

    });

    if(filteredTasks.length===0){

        taskList.innerHTML=`<li style="justify-content:center;color:#888;">No tasks found.</li>`;

    }

}