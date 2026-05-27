namespace notes_api.Models
{
    public class Note
    {
        public int Id { get; set; }
        public string Titre { get; set; } = string.Empty;
        public string Details { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
