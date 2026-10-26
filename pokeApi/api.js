const apiBaseUrl = "https://pokeapi.co/api/v2/";

const getJson = async (url, signal) => {
    const response = await fetch(url, { signal });
    if (!response.ok) {
        if (response.status === 404) {
            throw new Error("No se encontró ningún Pokémon con ese nombre o número.");
        }
        throw new Error(`La PokéAPI respondió con un error (${response.status}).`);
    }
    return response.json();
};

const getAllPokemons = async (limit = 151, offset = 0, signal) =>
    getJson(`${apiBaseUrl}pokemon?limit=${limit}&offset=${offset}`, signal);

const getPokemonById = async (id, signal) =>
    getJson(`${apiBaseUrl}pokemon/${encodeURIComponent(id)}`, signal);

const getPokemonSpecies = async (speciesUrl, signal) => getJson(speciesUrl, signal);

const getPokemonsAbility = async (abilityName, signal) =>
    getJson(`${apiBaseUrl}ability/${encodeURIComponent(abilityName)}`, signal);

const getPokemonType = async (typeName, signal) =>
    getJson(`${apiBaseUrl}type/${encodeURIComponent(typeName)}`, signal);

export { getAllPokemons, getPokemonById, getPokemonSpecies, getPokemonsAbility, getPokemonType };