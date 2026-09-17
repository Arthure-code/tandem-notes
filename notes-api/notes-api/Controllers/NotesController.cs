using Microsoft.AspNetCore.Mvc;
using NotesApi.Interfaces;
using NotesApi.Models;

namespace NotesApi.Controllers
{
    // The five routes of the API. Model validation is automatic under
    // [ApiController]: a note without a title comes back as 400 before the
    // action runs.
    [ApiController]
    [Route("api/[controller]")]
    [Produces("application/json")]
    public class NotesController : ControllerBase
    {
        private readonly INoteService _service;

        public NotesController(INoteService service)
        {
            _service = service;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Note>>> GetAll()
        {
            return Ok(await _service.GetAllAsync());
        }

        [HttpGet("{id:int}")]
        public async Task<ActionResult<Note>> GetById(int id)
        {
            var note = await _service.GetByIdAsync(id);
            if (note == null) return NotFound();
            return Ok(note);
        }

        [HttpPost]
        public async Task<ActionResult<Note>> Create(Note note)
        {
            var created = await _service.CreateAsync(note);
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }

        [HttpPut("{id:int}")]
        public async Task<ActionResult<Note>> Update(int id, Note note)
        {
            var updated = await _service.UpdateAsync(id, note);
            if (updated == null) return NotFound();
            return Ok(updated);
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            var deleted = await _service.DeleteAsync(id);
            if (!deleted) return NotFound();
            return NoContent();
        }
    }
}
