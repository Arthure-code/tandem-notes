using notes_api.Models;

namespace notes_api.Interfaces
{
    public interface INoteService
    {
        Task<IEnumerable<Note>> GetAllAsync();
        Task<Note?> GetByIdAsync(int id);
        Task<Note> CreateAsync(Note note);
        Task<Note?> UpdateAsync(int id, Note note);
        Task<bool> DeleteAsync(int id);
    }
}
