import { Component, OnInit } from '@angular/core';
import { Task } from 'src/app/models/task';
import { TaskService } from 'src/app/services/task.service';

@Component({
  selector: 'app-my-tasks',
  templateUrl: './my-tasks.component.html',
  styleUrls: ['./my-tasks.component.css']
})
export class MyTasksComponent implements OnInit {
  sentTasks: Task[] = [];
  receivedTasks: Task[] = [];
  activeTab: 'received' | 'sent' = 'received';

  userId: number = 0

  constructor(private taskService: TaskService) {}

  ngOnInit(): void {
    let idUser = Number(localStorage.getItem("userId"))
    if (idUser) {
      this.userId = +idUser;
      this.loadTasks();
    }
  }

  loadTasks(): void {
    this.taskService.getTasksFromSender(this.userId).subscribe({
      next: (tasks) => this.sentTasks = tasks,
      error: (err) => console.error('Failed to load sent tasks', err)
    });

    this.taskService.getTasksForReceiver(this.userId).subscribe({
      next: (tasks) => this.receivedTasks = tasks,
      error: (err) => console.error('Failed to load received tasks', err)
    });
  }

  markAsDone(taskId: number): void {
    this.taskService.markTaskAsDone(taskId).subscribe({
      next: () => {
        this.receivedTasks = this.receivedTasks.map(task =>
          task.id === taskId ? { ...task, isDone: true } : task
        );
        this.loadTasks();
      },
      error: (err) => console.error('Failed to mark task as done', err)
    });
  }

}
