import { create } from 'zustand';

export const useProjectStore = create((set) => ({
  projects: [],
  selectedProject: null,
  setProjects: (projects) => set({ projects }),
  prependProject: (project) =>
    set((state) => ({
      projects: [project, ...state.projects],
    })),
  updateProject: (updated) =>
    set((state) => ({
      projects: state.projects.map((project) =>
        project.project_id === updated.project_id ? updated : project,
      ),
      selectedProject:
        state.selectedProject && state.selectedProject.project_id === updated.project_id
          ? updated
          : state.selectedProject,
    })),
  removeProject: (id) =>
    set((state) => ({
      projects: state.projects.filter((project) => project.project_id !== id),
      selectedProject:
        state.selectedProject && state.selectedProject.project_id === id ? null : state.selectedProject,
    })),
  selectProject: (project) => set({ selectedProject: project }),
  clearSelection: () => set({ selectedProject: null }),
}));
