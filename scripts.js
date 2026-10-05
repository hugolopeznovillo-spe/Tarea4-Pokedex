(() => {
    const apiUrl = "https://pokeapi.co/api/v2/pokemon/";
    const catalogUrl = `${apiUrl}?limit=151`;
    const nationalDexSize = 1025;
    const byId = (id) => document.getElementById(id);
    const ui = {
        name: byId("pokemon-name"),
        number: byId("pokemon-number"),
        detailsNumber: byId("details-number"),
        species: byId("pokemon-species"),
        description: byId("pokemon-description"),
        image: byId("pokemon-image"),
        loading: byId("loading-message"),
        types: byId("pokemon-types"),
        height: byId("pokemon-height"),
        weight: byId("pokemon-weight"),
        stats: byId("pokemon-stats"),
        abilities: byId("pokemon-abilities"),
        search: byId("pokemon-search"),
        form: byId("search-form"),
        error: byId("error-message"),
        previous: byId("previous-button"),
        next: byId("next-button"),
        catalog: byId("catalog-list"),
        catalogSearch: byId("catalog-search"),
        catalogCount: byId("catalog-count"),
        catalogStatus: byId("catalog-status")
    };
    const statNames = {
        hp: "PS",
        attack: "Ataque",
        defense: "Defensa",
        "special-attack": "At. especial",
        "special-defense": "Def. especial",
        speed: "Velocidad"
    };
    const typeColors = {
        normal: "#A8A77A",
        fire: "#DC0A2D",
        water: "#6390F0",
        electric: "#F7D02C",
        grass: "#51AD60",
        ice: "#96D9D6",
        fighting: "#C22E28",
        poison: "#A33EA1",
        ground: "#E2BF65",
        flying: "#A98FF3",
        psychic: "#F95587",
        bug: "#A6B91A",
        rock: "#B6A136",
        ghost: "#735797",
        dragon: "#6F35FC",
        dark: "#705746",
        steel: "#B7B7CE",
        fairy: "#D685AD"
    };

    let currentId = 1;
    let requestNumber = 0;
    let imageOptions = [];
    let catalogEntries = [];

    function showImage(index) {
        if (index >= imageOptions.length) {
            ui.image.hidden = true;
            ui.loading.textContent = "Imagen no disponible";
            ui.loading.hidden = false;
            return;
        }
        imageOptions = imageOptions.slice(index);
        ui.image.src = imageOptions[0];
        ui.image.hidden = false;
    }

    function renderPokemon(pokemon) {
        currentId = pokemon.id;
        ui.name.textContent = pokemon.name.replaceAll("-", " ");
        ui.number.textContent = `N.º ${String(pokemon.id).padStart(3, "0")}`;
        ui.detailsNumber.textContent = `#${String(pokemon.id).padStart(3, "0")}`;
        ui.species.textContent = "Cargando...";
        ui.description.textContent = "Cargando registro de la Pokédex...";
        ui.search.value = String(pokemon.id);
        ui.height.textContent = (pokemon.height / 10).toFixed(1);
        ui.weight.textContent = (pokemon.weight / 10).toFixed(1);

        ui.types.replaceChildren(...pokemon.types.map(({ type }) => {
            const badge = document.createElement("span");
            badge.className = "badge type-badge";
            badge.classList.add(`type-${type.name}`);
            badge.style.setProperty("--pokemon-type-color", typeColors[type.name] || "#30A7D7");
            badge.textContent = type.name.toUpperCase();
            return badge;
        }));
        const sprites = pokemon.sprites;
        imageOptions = [
            sprites.other?.["official-artwork"]?.front_default,
            sprites.other?.home?.front_default,
            sprites.front_default
        ].filter(Boolean);
        ui.image.alt = `Imagen de ${pokemon.name}`;
        ui.image.hidden = true;
        ui.loading.textContent = imageOptions.length ? "Cargando imagen..." : "Imagen no disponible";
        ui.loading.hidden = imageOptions.length === 0;
        if (imageOptions.length) showImage(0);

        ui.stats.replaceChildren(...pokemon.stats.map(({ base_stat, stat }) => {
            const row = document.createElement("div");
            row.className = "stat-row d-flex align-items-center gap-2";

            const label = document.createElement("span");
            label.className = "stat-label";
            label.textContent = statNames[stat.name] || stat.name;

            const track = document.createElement("div");
            track.className = "progress stat-track";
            track.setAttribute("role", "progressbar");
            track.setAttribute("aria-label", label.textContent);
            track.setAttribute("aria-valuemin", "0");
            track.setAttribute("aria-valuemax", "255");
            track.setAttribute("aria-valuenow", String(base_stat));

            const fill = document.createElement("span");
            fill.className = "progress-bar bg-success stat-fill";
            fill.style.width = `${Math.min(base_stat / 255 * 100, 100)}%`;
            track.append(fill);

            const value = document.createElement("strong");
            value.textContent = String(base_stat);
            row.append(label, track, value);
            return row;
        }));

        ui.abilities.replaceChildren(...pokemon.abilities.map(({ ability, is_hidden }) => {
            const badge = document.createElement("span");
            badge.className = "badge ability-badge";
            badge.textContent = ability.name.replaceAll("-", " ") + (is_hidden ? " (oculta)" : "");
            return badge;
        }));

        ui.catalog.querySelectorAll("[data-pokemon-id]").forEach((entry) => {
            entry.classList.toggle("is-current", Number(entry.dataset.pokemonId) === pokemon.id);
        });
    }

    async function loadSpecies(url, currentRequest, signal) {
        try {
            const response = await fetch(url, { signal });
            if (!response.ok) {
                throw new Error(`La PokéAPI respondió con un error (${response.status}).`);
            }
            const species = await response.json();
            if (currentRequest !== requestNumber) return;
            const genus = species.genera.find(({ language }) => language.name === "es")
                || species.genera.find(({ language }) => language.name === "en");
            ui.species.textContent = genus?.genus || species.name.replaceAll("-", " ");
            const flavor = species.flavor_text_entries.find(({ language }) => language.name === "es")
                || species.flavor_text_entries.find(({ language }) => language.name === "en");
            ui.description.textContent = flavor
                ? flavor.flavor_text.replace(/[\f\n\r]+/g, " ").replace(/\s+/g, " ").trim()
                : "Registro oficial no disponible.";
        } catch (error) {
            if (currentRequest !== requestNumber || error.name === "AbortError") return;
            ui.species.textContent = "No disponible";
            ui.description.textContent = "No se pudo cargar el registro oficial.";
            console.error("No se pudo cargar la especie del Pokémon.", error);
        }
    }

    function renderCatalog(query = "") {
        const normalizedQuery = query.trim().toLowerCase();
        const filteredEntries = catalogEntries.filter(({ id, name }) =>
            name.replaceAll("-", " ").includes(normalizedQuery)
            || String(id).includes(normalizedQuery)
            || String(id).padStart(3, "0").includes(normalizedQuery)
        );

        ui.catalogCount.textContent = `${filteredEntries.length} / ${catalogEntries.length}`;
        ui.catalog.replaceChildren(...filteredEntries.map(({ id, name }) => {
            const entry = document.createElement("button");
            entry.className = "catalog-entry d-flex align-items-center gap-1";
            entry.type = "button";
            entry.dataset.pokemonId = String(id);
            entry.setAttribute("aria-label", `Abrir ${name.replaceAll("-", " ")}, número ${id}`);
            entry.classList.toggle("is-current", id === currentId);

            const sprite = document.createElement("img");
            sprite.className = "flex-shrink-0";
            sprite.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
            sprite.alt = "";
            sprite.loading = "lazy";

            const number = document.createElement("span");
            number.className = "catalog-number text-info fw-bold";
            number.textContent = `#${String(id).padStart(3, "0")}`;

            const label = document.createElement("span");
            label.className = "catalog-name flex-grow-1";
            label.textContent = name.replaceAll("-", " ");

            entry.append(sprite, number, label);
            return entry;
        }));
        ui.catalogStatus.textContent = filteredEntries.length
            ? ""
            : catalogEntries.length ? "No hay Pokémon que coincidan." : ui.catalogStatus.textContent;
    }

    async function loadCatalog() {
        try {
            const response = await fetch(catalogUrl);
            if (!response.ok) {
                throw new Error(`La PokéAPI respondió con un error (${response.status}).`);
            }
            const data = await response.json();
            catalogEntries = data.results.map(({ name }, index) => ({ id: index + 1, name }));
            ui.catalogStatus.textContent = "";
            renderCatalog(ui.catalogSearch.value);
        } catch (error) {
            ui.catalogCount.textContent = "No disponible";
            ui.catalogStatus.textContent = "No se pudo cargar el catálogo. Comprueba tu conexión e inténtalo de nuevo.";
            console.error("No se pudo cargar el catálogo de Kanto.", error);
        }
    }

    async function loadPokemon(query) {
        const currentRequest = ++requestNumber;
        const controller = new AbortController();
        const timeout = window.setTimeout(() => controller.abort(), 12000);
        ui.error.hidden = true;
        ui.loading.textContent = "Cargando Pokémon...";
        ui.loading.hidden = false;
        ui.image.hidden = true;
        ui.name.textContent = "Cargando...";
        ui.previous.disabled = true;
        ui.next.disabled = true;
        document.querySelectorAll(".dpad button").forEach((button) => {
            button.disabled = true;
        });

        try {
            const response = await fetch(`${apiUrl}${encodeURIComponent(query)}`, {
                signal: controller.signal
            });
            if (response.status === 404) {
                throw new Error("No se encontró ese Pokémon. Prueba con su nombre en inglés o número.");
            }
            if (!response.ok) {
                throw new Error(`La PokéAPI respondió con un error (${response.status}).`);
            }

            const pokemon = await response.json();
            if (currentRequest === requestNumber) {
                renderPokemon(pokemon);
                void loadSpecies(pokemon.species.url, currentRequest, controller.signal);
            }
        } catch (error) {
            if (currentRequest !== requestNumber) return;
            ui.name.textContent = "No se pudo cargar";
            ui.number.textContent = "";
            ui.loading.textContent = error.name === "AbortError"
                ? "La consulta tardó demasiado"
                : error.message || "No hay conexión con la PokéAPI.";
            ui.loading.hidden = false;
            ui.image.hidden = true;
            ui.types.replaceChildren();
            ui.detailsNumber.textContent = "";
            ui.species.textContent = "—";
            ui.description.textContent = "Registro oficial no disponible.";
            ui.stats.replaceChildren();
            ui.abilities.replaceChildren();
            ui.height.textContent = "—";
            ui.weight.textContent = "—";
            ui.error.textContent = ui.loading.textContent;
            ui.error.hidden = false;
        } finally {
            window.clearTimeout(timeout);
            if (currentRequest === requestNumber) {
                ui.previous.disabled = false;
                ui.next.disabled = false;
                document.querySelectorAll(".dpad button").forEach((button) => {
                    button.disabled = false;
                });
            }
        }
    }

    ui.image.addEventListener("load", () => {
        ui.loading.hidden = true;
    });
    ui.image.addEventListener("error", () => {
        showImage(1);
    });
    ui.form.addEventListener("submit", (event) => {
        event.preventDefault();
        const query = ui.search.value.trim().toLowerCase().replaceAll(" ", "-");
        if (query) loadPokemon(query);
    });
    ui.previous.addEventListener("click", () => {
        loadPokemon(currentId === 1 ? nationalDexSize : currentId - 1);
    });
    ui.next.addEventListener("click", () => {
        loadPokemon(currentId === nationalDexSize ? 1 : currentId + 1);
    });
    document.querySelectorAll(".dpad button").forEach((button) => {
        button.addEventListener("click", () => {
            if (button.disabled) return;
            const step = Number(button.dataset.step);
            const nextId = currentId + step;
            loadPokemon(nextId < 1 ? nationalDexSize : nextId > nationalDexSize ? 1 : nextId);
        });
    });
    ui.catalog.addEventListener("click", (event) => {
        if (!(event.target instanceof Element)) return;
        const entry = event.target.closest("[data-pokemon-id]");
        if (entry) {
            loadPokemon(entry.dataset.pokemonId);
            ui.catalogSearch.value = "";
            renderCatalog();
        }
    });
    ui.catalogSearch.addEventListener("input", () => {
        renderCatalog(ui.catalogSearch.value);
    });
    document.addEventListener("keydown", (event) => {
        if (event.altKey || event.ctrlKey || event.metaKey || event.target instanceof HTMLInputElement) return;
        if (event.key === "ArrowLeft" || event.key === "ArrowUp") ui.previous.click();
        if (event.key === "ArrowRight" || event.key === "ArrowDown") ui.next.click();
    });

    loadPokemon(currentId);
    void loadCatalog();
})();
