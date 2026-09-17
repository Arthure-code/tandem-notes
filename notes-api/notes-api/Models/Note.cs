using System.ComponentModel.DataAnnotations;

namespace NotesApi.Models
{
    // A note: a title, a body, and when it was created and last changed. The
    // dates are set by the service, never by the client.
    public class Note
    {
        public int Id { get; set; }

        [Required]
        [StringLength(100, MinimumLength = 1)]
        public string Title { get; set; } = string.Empty;

        [StringLength(10000)]
        public string Body { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
