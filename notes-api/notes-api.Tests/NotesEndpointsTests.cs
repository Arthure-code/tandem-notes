using Xunit;
using System.Net;
using System.Net.Http.Json;
using NotesApi.Models;

namespace NotesApi.Tests
{
    // The five routes, through HTTP, against the real pipeline: validation,
    // status codes, ordering, and the dates the service sets.
    public class NotesEndpointsTests : IClassFixture<ApiFactory>
    {
        private readonly HttpClient _client;

        public NotesEndpointsTests(ApiFactory factory)
        {
            _client = factory.CreateClient();
        }

        private async Task<Note> CreateAsync(string title, string body = "")
        {
            var response = await _client.PostAsJsonAsync("/api/notes", new { title, body });
            response.EnsureSuccessStatusCode();
            return (await response.Content.ReadFromJsonAsync<Note>())!;
        }

        [Fact]
        public async Task Post_creates_the_note_and_answers_201_with_its_location()
        {
            var response = await _client.PostAsJsonAsync("/api/notes", new { title = "Groceries", body = "Milk" });

            Assert.Equal(HttpStatusCode.Created, response.StatusCode);
            var note = await response.Content.ReadFromJsonAsync<Note>();
            Assert.NotNull(note);
            Assert.True(note.Id > 0);
            Assert.Equal("Groceries", note.Title);
            Assert.Equal("Milk", note.Body);
            Assert.Equal($"/api/notes/{note.Id}", response.Headers.Location?.PathAndQuery);
        }

        [Fact]
        public async Task Post_sets_the_dates_itself_and_trims_the_title()
        {
            var before = DateTime.UtcNow.AddSeconds(-1);

            var note = await CreateAsync("  Trimmed  ");

            Assert.Equal("Trimmed", note.Title);
            Assert.True(note.CreatedAt >= before);
            Assert.Equal(note.CreatedAt, note.UpdatedAt);
        }

        [Theory]
        [InlineData("")]
        [InlineData("   ")]
        public async Task Post_without_a_title_answers_400(string title)
        {
            var response = await _client.PostAsJsonAsync("/api/notes", new { title, body = "x" });

            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        }

        [Fact]
        public async Task Post_with_a_title_over_100_characters_answers_400()
        {
            var response = await _client.PostAsJsonAsync("/api/notes", new { title = new string('a', 101), body = "" });

            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        }

        [Fact]
        public async Task Get_lists_the_notes_newest_change_first()
        {
            var first = await CreateAsync("Older");
            await Task.Delay(20);
            var second = await CreateAsync("Newer");

            var notes = await _client.GetFromJsonAsync<List<Note>>("/api/notes");

            Assert.NotNull(notes);
            var ids = notes.Select(n => n.Id).ToList();
            Assert.True(ids.IndexOf(second.Id) < ids.IndexOf(first.Id));
        }

        [Fact]
        public async Task Get_by_id_returns_the_note_or_404()
        {
            var note = await CreateAsync("Found");

            var found = await _client.GetAsync($"/api/notes/{note.Id}");
            var missing = await _client.GetAsync("/api/notes/999999");

            Assert.Equal(HttpStatusCode.OK, found.StatusCode);
            Assert.Equal("Found", (await found.Content.ReadFromJsonAsync<Note>())!.Title);
            Assert.Equal(HttpStatusCode.NotFound, missing.StatusCode);
        }

        [Fact]
        public async Task Put_changes_title_and_body_and_moves_UpdatedAt_forward()
        {
            var note = await CreateAsync("Draft", "v1");
            await Task.Delay(20);

            var response = await _client.PutAsJsonAsync($"/api/notes/{note.Id}", new { title = "Final", body = "v2" });

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var updated = await response.Content.ReadFromJsonAsync<Note>();
            Assert.NotNull(updated);
            Assert.Equal("Final", updated.Title);
            Assert.Equal("v2", updated.Body);
            Assert.Equal(note.CreatedAt, updated.CreatedAt);
            Assert.True(updated.UpdatedAt > note.UpdatedAt);
        }

        [Fact]
        public async Task Put_on_an_unknown_id_answers_404_and_without_a_title_400()
        {
            var note = await CreateAsync("Keep");

            var missing = await _client.PutAsJsonAsync("/api/notes/999999", new { title = "x", body = "" });
            var invalid = await _client.PutAsJsonAsync($"/api/notes/{note.Id}", new { title = "", body = "" });

            Assert.Equal(HttpStatusCode.NotFound, missing.StatusCode);
            Assert.Equal(HttpStatusCode.BadRequest, invalid.StatusCode);
        }

        [Fact]
        public async Task Delete_removes_the_note_then_answers_404()
        {
            var note = await CreateAsync("Gone");

            var first = await _client.DeleteAsync($"/api/notes/{note.Id}");
            var second = await _client.DeleteAsync($"/api/notes/{note.Id}");

            Assert.Equal(HttpStatusCode.NoContent, first.StatusCode);
            Assert.Equal(HttpStatusCode.NotFound, second.StatusCode);
        }

        [Fact]
        public async Task A_browser_from_an_allowed_origin_gets_the_cors_header_and_an_unknown_one_does_not()
        {
            using var allowed = new HttpRequestMessage(HttpMethod.Get, "/api/notes");
            allowed.Headers.Add("Origin", "tauri://localhost");
            using var unknown = new HttpRequestMessage(HttpMethod.Get, "/api/notes");
            unknown.Headers.Add("Origin", "https://evil.example");

            var allowedResponse = await _client.SendAsync(allowed);
            var unknownResponse = await _client.SendAsync(unknown);

            Assert.True(allowedResponse.Headers.Contains("Access-Control-Allow-Origin"));
            Assert.False(unknownResponse.Headers.Contains("Access-Control-Allow-Origin"));
        }
    }
}
