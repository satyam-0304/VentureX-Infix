import React, { useState } from 'react';
import { 
  ChevronDown, 
  Check, 
  Lightbulb, 
  Lock, 
  ArrowRight, 
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import { useLearning } from '../../contexts/LearningContext';

export const ActivitiesPanel: React.FC = () => {
  const {
    activeSession,
    selectTaskOption,
    submitTaskAnswer,
    seekTo
  } = useLearning();

  // Keep track of which accordion panels are expanded
  const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>({
    'task-1': true,
    'task-2': false,
    'task-3': false,
    'task-4': false,
    'task-5': false
  });

  const [feedbackMessages, setFeedbackMessages] = useState<Record<string, string | null>>({});
  const [isShaking, setIsShaking] = useState<Record<string, boolean>>({});

  const toggleAccordion = (taskId: string) => {
    setExpandedTasks((prev) => ({
      ...prev,
      [taskId]: !prev[taskId]
    }));
  };

  const tasks = activeSession.tasks;

  // Calculate completion percentage
  const completedCount = tasks.filter((t) => t.status === 'completed').length;
  const totalCount = Math.max(1, tasks.length);
  const percentComplete = Math.round((completedCount / totalCount) * 100);

  // SVG circular stroke dash computation (circumference is ~100)
  const strokeDash = `${percentComplete}, 100`;

  const handleSubmit = (taskId: string) => {
    const result = submitTaskAnswer(taskId);
    if (result.isCorrect) {
      setFeedbackMessages((prev) => ({ ...prev, [taskId]: null }));
      // Open next task automatically
      const currentIdx = tasks.findIndex((t) => t.id === taskId);
      const nextTask = tasks[currentIdx + 1];
      if (nextTask) {
        setExpandedTasks((prev) => ({
          ...prev,
          [nextTask.id]: true
        }));
      }
    } else {
      setFeedbackMessages((prev) => ({ ...prev, [taskId]: result.message }));
      setIsShaking((prev) => ({ ...prev, [taskId]: true }));
      setTimeout(() => {
        setIsShaking((prev) => ({ ...prev, [taskId]: false }));
      }, 400);
    }
  };

  return (
    <div
      data-purpose="tasks-panel"
      className="bg-white rounded-2xl border border-slate-100 shadow-xl p-5 flex flex-col space-y-4 relative"
    >
      {/* Panel Header with Progress Ring */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <h3 className="font-bold text-base text-slate-900">Learning Activities</h3>
          <p className="text-xs text-slate-400">Synchronized with lecture video</p>
        </div>

        {/* Circular Progress Ring Badge */}
        <div className="flex items-center space-x-2.5">
          <div className="relative w-9 h-9 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-slate-100"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                strokeWidth="3.5"
              />
              <path
                className="text-emerald-500 transition-all duration-700 ease-out"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                id="progressCirclePath"
                stroke="currentColor"
                strokeDasharray={strokeDash}
                strokeLinecap="round"
                strokeWidth="3.5"
              />
            </svg>
            <span
              id="progressPercentLabel"
              className="absolute text-[10px] font-bold text-slate-700"
            >
              {percentComplete}%
            </span>
          </div>
          <span
            id="progressSummaryLabel"
            className="text-xs font-semibold text-slate-700 whitespace-nowrap"
          >
            {completedCount}/{totalCount} Done
          </span>
        </div>
      </div>

      {/* Expandable Tasks Accordion Stack */}
      <div id="tasksAccordion" className="space-y-3">
        {tasks.map((task) => {
          const isExpanded = !!expandedTasks[task.id];
          const isCompleted = task.status === 'completed';
          const isLocked = task.status === 'locked';
          const feedback = feedbackMessages[task.id];
          const shaking = isShaking[task.id];

          return (
            <div
              key={task.id}
              id={`taskCard-${task.id}`}
              className={`rounded-xl border transition-all ${
                isCompleted
                  ? 'border-emerald-200 bg-emerald-50/20'
                  : task.status === 'active'
                  ? 'border-indigo-100 bg-indigo-50/20'
                  : 'border-slate-100 bg-white'
              } p-4 ${shaking ? 'animate-shake' : ''}`}
            >
              {/* Task Accordion Header */}
              <div
                onClick={() => !isLocked && toggleAccordion(task.id)}
                className={`flex items-center justify-between ${
                  isLocked ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <span
                    className={`w-5 h-5 rounded-full text-[11px] font-bold flex items-center justify-center transition-colors ${
                      isCompleted
                        ? 'bg-emerald-500 text-white'
                        : task.status === 'active'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {isCompleted ? <Check className="w-3 h-3 stroke-[3]" /> : task.stepNumber}
                  </span>
                  <span
                    className={`text-xs font-bold ${
                      isCompleted ? 'text-slate-800' : 'text-slate-700'
                    }`}
                  >
                    {task.title}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  {/* Status Pill */}
                  {isCompleted ? (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-semibold">
                      Done
                    </span>
                  ) : isLocked ? (
                    <span className="flex items-center space-x-1 text-[11px] text-slate-400">
                      <Lock className="w-3 h-3" />
                      <span>Locked</span>
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-semibold">
                      Active
                    </span>
                  )}

                  {!isLocked && (
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                        isExpanded ? 'rotate-180' : ''
                      }`}
                    />
                  )}
                </div>
              </div>

              {/* Task Expanded Body */}
              {isExpanded && !isLocked && (
                <div className="pt-3 border-t border-slate-100/80 mt-2 space-y-3">
                  {/* Question Prompt */}
                  {task.question && (
                    <p className="text-xs font-semibold text-slate-800 leading-snug">
                      {task.question}
                    </p>
                  )}

                  {/* Multiple Choice Options */}
                  {task.options && task.options.length > 0 && (
                    <div className="space-y-2">
                      {task.options.map((option) => {
                        const isSelected = task.selectedOptionId === option.id;
                        const isCorrectOption = option.isCorrect;

                        return (
                          <label
                            key={option.id}
                            onClick={() => selectTaskOption(task.id, option.id)}
                            className={`flex items-center space-x-2.5 p-2 rounded-lg text-xs cursor-pointer transition-all ${
                              isSelected
                                ? isCompleted && isCorrectOption
                                  ? 'border-2 border-emerald-500 bg-emerald-50/70 text-slate-900 font-medium'
                                  : isCompleted && !isCorrectOption
                                  ? 'border-2 border-rose-400 bg-rose-50/70 text-slate-900'
                                  : 'border-2 border-indigo-500 bg-indigo-50/50 text-slate-900 font-medium'
                                : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                            }`}
                          >
                            <input
                              type="radio"
                              name={`task_${task.id}`}
                              checked={isSelected}
                              onChange={() => {}}
                              className="hidden"
                            />
                            <div
                              className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                                isSelected
                                  ? isCompleted && isCorrectOption
                                    ? 'bg-emerald-500 text-white'
                                    : 'bg-indigo-600 text-white'
                                  : 'border border-slate-300'
                              }`}
                            >
                              {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                            </div>
                            <span className="flex-1">{option.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}

                  {/* Pedagogical Explanation Callout */}
                  {(isCompleted || task.answeredCorrectly) && task.explanation && (
                    <div className="p-2.5 rounded-lg bg-amber-50/90 border border-amber-200 text-xs flex items-start space-x-2 animate-fade-in">
                      <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-amber-900 block text-[11px]">
                          Explanation:
                        </span>
                        <p className="text-amber-800 text-[11px] leading-relaxed">
                          {task.explanation}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Error Feedback Alert */}
                  {feedback && (
                    <div className="p-2 rounded-lg text-[11px] bg-rose-50 text-rose-700 border border-rose-200 flex items-center space-x-1.5 animate-fade-in">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{feedback}</span>
                    </div>
                  )}

                  {/* Concept Description / Jump Seek */}
                  {task.contentDescription && (
                    <div className="text-xs text-slate-600 space-y-2">
                      <p>{task.contentDescription}</p>
                      {task.timestampTarget !== undefined && (
                        <button
                          onClick={() => seekTo(task.timestampTarget!)}
                          className="text-indigo-600 hover:underline font-medium text-xs flex items-center space-x-1 cursor-pointer"
                        >
                          <span>Jump video to topic ({Math.floor(task.timestampTarget / 60)}:00)</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  )}

                  {/* Submit / Continue Button */}
                  {task.options && !isCompleted && (
                    <button
                      onClick={() => handleSubmit(task.id)}
                      className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
                    >
                      <span>Check & Continue</span>
                      <ArrowRight className="w-3.5 h-3.5 pointer-events-none" />
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

