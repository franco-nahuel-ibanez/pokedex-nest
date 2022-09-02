import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import { CreatePokemonDto } from './dto/create-pokemon.dto';
import { UpdatePokemonDto } from './dto/update-pokemon.dto';
import { Pokemon } from './entities/pokemon.entity';

@Injectable()
export class PokemonService {
  constructor(
    @InjectModel(Pokemon.name)
    private readonly pokemonModel: Model<Pokemon>,
  ) { }

  /**CREATE */
  async create(createPokemonDto: CreatePokemonDto) {
    createPokemonDto.name = createPokemonDto.name.toLocaleLowerCase()

    try {
      const pokemon = await this.pokemonModel.create(createPokemonDto);
      return pokemon
    } catch (error) {
      this.handleExceptions(error)
    }
  }


  /**FIND ALL */
  findAll() {
    return `This action returns all pokemon`;
  }

  /**FIND ONE */
  async findOne(id: string) {

    let pokemon: Pokemon

    //verificar que el id sea un numero
    if (!isNaN(+id)) {
      pokemon = await this.pokemonModel.findOne({ no: id })
    }

    //MongoID
    if (!pokemon && isValidObjectId(id)) {
      pokemon = await this.pokemonModel.findById(id);
    }

    //name
    if (!pokemon) {
      pokemon = await this.pokemonModel.findOne({ name: id.toLowerCase().trim() })
    }

    if (!pokemon)
      throw new NotFoundException(`Pokemon with id, name or no "${id}" not found`)

    return pokemon
  }

  /**UPDATE */
  async update(term: string, updatePokemonDto: UpdatePokemonDto) {

    const pokemon = await this.findOne(term)
    if (updatePokemonDto.name) {
      updatePokemonDto.name = updatePokemonDto.name.toLowerCase()
    }

    try {
      await pokemon.updateOne(updatePokemonDto, { new: true })
      return {
        ...pokemon.toJSON(),
        ...updatePokemonDto
      }
    } catch (error) {
      this.handleExceptions(error)
    }
  }

  /**REMOVE */
  async remove(id: string) {
  /*
    const pokemon = await this.findOne(term)
    await pokemon.deleteOne()
    const result = await this.pokemonModel.findByIdAndDelete( id );
  */

    //de esta forma solo debemos realizar una consulta a la base de datos 
    //y contestar con un error si hace falta
    const {deletedCount} = await this.pokemonModel.deleteOne({ _id: id})

    if(deletedCount === 0){
      throw new BadRequestException(`Pokemon with id "${id}" not found`)
    }

    return

  }

  private handleExceptions(error: any) {
    if (error.code === 11000) {
      throw new BadRequestException(`Pokemon exist in db. ${JSON.stringify(error.keyValue)}`)
    }
    console.log(error)
    throw new InternalServerErrorException("Can't update Pokemon - Check server logs")
  }
}
