const apiBaseUrl = "https://pokeapi.co/api/v2";

const getJson = async (path) => {
    const response = await fetch(`${apiBaseUrl}/${path}`);
    if (!response.ok) {
        if (response.status === 404) {
            throw new Error("No se encontró ningún Pokémon con ese nombre o número.");
        }
        throw new Error("No se pudo conectar con la PokéAPI. Inténtalo de nuevo.");
    }
    return response.json();
};

const getAllPokemons = async () => getJson("pokemon");

const getPokemonById = async (id) => getJson(`pokemon/${encodeURIComponent(id)}`);

const getPokemonsAbility = async (abilityName) => getJson(`ability/${encodeURIComponent(abilityName)}`);

const getPokemonType = async (typeName) => getJson(`type/${encodeURIComponent(typeName)}`);

export {getAllPokemons, getPokemonById, getPokemonsAbility, getPokemonType}